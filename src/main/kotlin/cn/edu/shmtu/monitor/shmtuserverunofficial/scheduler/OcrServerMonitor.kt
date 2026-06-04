package cn.edu.shmtu.monitor.shmtuserverunofficial.scheduler

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.OcrProperties
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OcrServerRegistry
import okhttp3.OkHttpClient
import okhttp3.Request
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.util.concurrent.TimeUnit

/**
 * OCR 服务器主动探活 + 上报到 OcrServerRegistry。
 *
 * 替代旧 shmtu-service-monitor (Rust axum) 的 poller：
 *   - 每隔 fixedDelay 触发一次（默认 10s，可在 application.yaml 的 ocr.monitor 配置覆盖）
 *   - 对每台 enabled=true 的服务器并发异步探测
 *   - 探测路径优先 /api/ocr/status（与 OcrController 协议一致），失败回退 /api/health
 *   - 探测结果通过 OcrServerRegistry.record(name, latencyMs, success) 上报，
 *     OcrServerRegistry 内部维护滑动窗口用于排序与 OcrServerStatus 展示
 *
 * 前端 monitor 页面（Server/shmtu-server-unofficial/frontend/src/pages/monitor/...）通过
 * GET /api/ocr/servers 拉取数据，无需新建专用 monitor 端点。
 */
@Component
class OcrServerMonitor(
    private val ocrProperties: OcrProperties,
    private val ocrServerRegistry: OcrServerRegistry
) {
    private val logger = LoggerFactory.getLogger(OcrServerMonitor::class.java)

    private val probeClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(ocrProperties.perServerTimeoutMs, TimeUnit.MILLISECONDS)
        .build()

    /**
     * 主循环：每 10 秒扫描一次所有 enabled OCR 服务器。
     * fixedDelay 而不是 fixedRate，避免轮询堆积。
     */
    @Scheduled(
        initialDelayString = "\${ocr.monitor.initial-delay-ms:5000}",
        fixedDelayString = "\${ocr.monitor.interval-ms:10000}"
    )
    fun pollAll() {
        val enabledServers = ocrProperties.servers.filter { it.enabled }
        if (enabledServers.isEmpty()) {
            if (logger.isDebugEnabled) {
                logger.debug("No enabled OCR server configured, skipping probe cycle")
            }
            return
        }
        for (cfg in enabledServers) {
            probeAsync(cfg.name, cfg.mode, cfg.baseUrl, cfg.host, cfg.port)
        }
    }

    /**
     * 单台探活：HTTP 调 {baseUrl}/api/ocr/status；TCP 模式直接短连。
     * 异步执行，单台失败不影响其他。
     */
    @Async("ocrMonitorExecutor")
    fun probeAsync(
        serverName: String,
        mode: String,
        baseUrl: String,
        host: String,
        port: Int
    ) {
        val t0 = System.currentTimeMillis()
        val success = try {
            when (mode.lowercase()) {
                "tcp" -> probeTcp(host, port)
                else -> probeHttp(baseUrl)
            }
        } catch (e: Exception) {
            logger.debug("Probe failed for {}: {}", serverName, e.message)
            false
        }
        val latency = System.currentTimeMillis() - t0
        ocrServerRegistry.record(serverName, latency, success)
    }

    private fun probeHttp(baseUrl: String): Boolean {
        if (baseUrl.isBlank()) return false
        val normalized = baseUrl.trimEnd('/')
        // 优先 /api/ocr/status（与本服务 OcrController 协议对齐），失败回退 /api/health
        val candidates = listOf("$normalized/api/ocr/status", "$normalized/api/health", "$normalized/health")
        for (url in candidates) {
            val request = Request.Builder().url(url).get().build()
            try {
                probeClient.newCall(request).execute().use { resp ->
                    if (resp.isSuccessful) return true
                }
            } catch (_: Exception) {
                // 继续尝试下一个候选路径
            }
        }
        return false
    }

    private fun probeTcp(host: String, port: Int): Boolean {
        if (host.isBlank() || port <= 0) return false
        return try {
            java.net.Socket().use { socket ->
                socket.connect(java.net.InetSocketAddress(host, port), 2000)
                true
            }
        } catch (_: Exception) {
            false
        }
    }
}
