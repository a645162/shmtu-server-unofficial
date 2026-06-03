package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.OcrProperties
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrServerStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference

/**
 * 多 OCR 服务器注册表 + 实时排序。
 *
 * 内存滑动窗口：
 *   - 每台 server 维护最近 windowSize 次的 (latencyMs, success) 样本
 *   - 调用 OcrService 报告一次结果后调用 record(...)
 *   - getRankedAvailable() 返回按平均耗时升序的列表（无样本的 server 用 initialWeight 占位）
 *
 * 线程安全：所有更新走 ConcurrentHashMap；快照用 AtomicReference 暴露。
 */
@Component
class OcrServerRegistry(
    private val ocrProperties: OcrProperties
) {
    private val logger = LoggerFactory.getLogger(OcrServerRegistry::class.java)

    data class Sample(val latencyMs: Long, val success: Boolean, val timestamp: Long = System.currentTimeMillis())

    data class ServerSnapshot(
        val name: String,
        val mode: String,
        val enabled: Boolean,
        val address: String,
        val avgLatencyMs: Double,
        val successRate: Double,
        val sampleCount: Int
    )

    private val samples: ConcurrentHashMap<String, ArrayDeque<Sample>> = ConcurrentHashMap()
    private val rankingRef = AtomicReference<List<ServerSnapshot>>(emptyList())

    init {
        rebuildRanking()
    }

    /**
     * 报告一次调用结果。失败时 latencyMs 传调用耗时，success=false 也参与排序（拉低排名）。
     */
    fun record(serverName: String, latencyMs: Long, success: Boolean) {
        if (serverName.isBlank()) return
        val deque = samples.computeIfAbsent(serverName) { ArrayDeque() }
        synchronized(deque) {
            deque.addLast(Sample(latencyMs, success))
            while (deque.size > ocrProperties.windowSize) {
                deque.removeFirst()
            }
        }
        rebuildRanking()
    }

    fun snapshot(): List<ServerSnapshot> = rankingRef.get()

    /**
     * 给出按平均耗时升序的可用 server 名称列表（取前 maxTry 个；只含 enabled=true）。
     * 调用方按此顺序尝试；调用后用 record(...) 上报结果。
     */
    fun getRankedAvailable(maxTry: Int = ocrProperties.maxTry): List<String> {
        return rankingRef.get()
            .asSequence()
            .filter { it.enabled }
            .take(maxTry)
            .map { it.name }
            .toList()
    }

    fun reset() {
        samples.clear()
        rebuildRanking()
    }

    fun toStatusDtos(): List<OcrServerStatus> = rankingRef.get().map { s ->
        OcrServerStatus(
            name = s.name,
            mode = s.mode,
            enabled = s.enabled,
            address = s.address,
            avgLatencyMs = s.avgLatencyMs,
            successRate = s.successRate,
            sampleCount = s.sampleCount
        )
    }

    private fun rebuildRanking() {
        val list = ocrProperties.servers.map { cfg ->
            val deque = samples[cfg.name]
            val (avg, rate, n) = if (deque == null || deque.isEmpty()) {
                Triple(ocrProperties.initialWeight.toDouble(), 1.0, 0)
            } else {
                val snap = synchronized(deque) { deque.toList() }
                val avgLat = snap.map { it.latencyMs }.average()
                val succ = snap.count { it.success }.toDouble() / snap.size
                Triple(avgLat, succ, snap.size)
            }
            val address = when (cfg.mode.lowercase()) {
                "tcp" -> "${cfg.host}:${cfg.port}"
                else -> cfg.baseUrl
            }
            ServerSnapshot(
                name = cfg.name,
                mode = cfg.mode,
                enabled = cfg.enabled,
                address = address,
                avgLatencyMs = avg,
                successRate = rate,
                sampleCount = n
            )
        }.sortedWith(
            compareBy<ServerSnapshot> { if (it.enabled) 0 else 1 }
                .thenBy { it.avgLatencyMs }
        )
        rankingRef.set(list)
        if (logger.isDebugEnabled) {
            logger.debug("OCR ranking: ${list.joinToString { "${it.name}=${it.avgLatencyMs.toInt()}ms(${it.sampleCount})" }}")
        }
    }
}
