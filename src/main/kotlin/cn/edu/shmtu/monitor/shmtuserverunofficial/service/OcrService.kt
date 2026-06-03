package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.OcrProperties
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrRecognizeRequest
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrRecognizeResponse
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrStatusResponse
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.InputStream
import java.io.OutputStream
import java.net.Socket
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * 多 OCR 服务器调度：
 *   1) OcrServerRegistry 按平均耗时给出排名
 *   2) 顺序尝试最多 maxTry 台；任一台成功即返回
 *   3) 每台调用结果回写到 Registry，用于实时排序
 *   4) 全部失败才返回 FAILED
 */
@Service
class OcrService(
    private val ocrProperties: OcrProperties,
    private val ocrServerRegistry: OcrServerRegistry
) {
    private val logger = LoggerFactory.getLogger(OcrService::class.java)
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .callTimeout(ocrProperties.perServerTimeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS)
        .build()

    fun recognize(request: OcrRecognizeRequest): OcrRecognizeResponse {
        val ranked = ocrServerRegistry.getRankedAvailable()
        if (ranked.isEmpty()) {
            return OcrRecognizeResponse(
                success = false, expression = null, result = null,
                error = "No OCR server configured or enabled"
            )
        }

        val lastErrors = mutableListOf<String>()
        for (name in ranked) {
            val cfg = ocrProperties.servers.firstOrNull { it.name == name } ?: continue
            val t0 = System.currentTimeMillis()
            val outcome = try {
                recognizeOnce(cfg, request.imageBase64)
            } catch (e: Exception) {
                OcrRecognizeResponse(
                    success = false, expression = null, result = null,
                    error = e.message ?: e::class.java.simpleName
                )
            }
            val latency = System.currentTimeMillis() - t0
            ocrServerRegistry.record(name, latency, outcome.success)
            if (outcome.success) return outcome
            lastErrors += "${name}: ${outcome.error}"
            logger.warn("OCR[$name] failed in ${latency}ms: ${outcome.error}")
        }
        return OcrRecognizeResponse(
            success = false, expression = null, result = null,
            error = "All OCR servers failed: ${lastErrors.joinToString("; ")}"
        )
    }

    fun getStatus(): OcrStatusResponse {
        val anyAvailable = ocrServerRegistry.snapshot().any { it.enabled }
        return OcrStatusResponse(
            available = anyAvailable,
            mode = "multi",
            lastCheckTime = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    private fun recognizeOnce(cfg: OcrProperties.OcrServerConfig, imageBase64: String): OcrRecognizeResponse {
        return when (cfg.mode.lowercase()) {
            "tcp" -> recognizeViaTcp(cfg, imageBase64)
            else -> recognizeViaHttp(cfg, imageBase64)
        }
    }

    private fun recognizeViaTcp(cfg: OcrProperties.OcrServerConfig, imageBase64: String): OcrRecognizeResponse {
        val imageBytes = java.util.Base64.getDecoder().decode(imageBase64)
        val socket = Socket()
        socket.connect(
            java.net.InetSocketAddress(cfg.host, cfg.port),
            ocrProperties.perServerTimeoutMs.toInt()
        )
        socket.soTimeout = ocrProperties.perServerTimeoutMs.toInt()
        socket.use {
            val outputStream: OutputStream = it.getOutputStream()
            val inputStream: InputStream = it.getInputStream()
            outputStream.write(imageBytes)
            outputStream.write("<END>".toByteArray(Charsets.UTF_8))
            outputStream.flush()
            val buffer = ByteArray(1024)
            val bytesRead = inputStream.read(buffer)
            val result = if (bytesRead > 0) {
                String(buffer, 0, bytesRead, Charsets.UTF_8).trim()
            } else ""
            if (result.isEmpty()) {
                return OcrRecognizeResponse(
                    success = false, expression = null, result = null,
                    error = "Empty TCP response"
                )
            }
            return OcrRecognizeResponse(success = true, expression = result, result = result)
        }
    }

    private fun recognizeViaHttp(cfg: OcrProperties.OcrServerConfig, imageBase64: String): OcrRecognizeResponse {
        val url = "${cfg.baseUrl.trimEnd('/')}/api/ocr"
        val jsonBody = JSONObject().apply { put("imageBase64", imageBase64) }
        val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url(url).post(requestBody).build()
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                return OcrRecognizeResponse(
                    success = false, expression = null, result = null,
                    error = "HTTP ${response.code}"
                )
            }
            val body = response.body?.string() ?: ""
            val json = JSONObject(body)
            val success = json.optBoolean("success", false)
            return if (success) {
                OcrRecognizeResponse(
                    success = true,
                    expression = json.optString("expression", null),
                    result = json.optString("result", null)
                )
            } else {
                OcrRecognizeResponse(
                    success = false, expression = null, result = null,
                    error = json.optString("error", "Unknown error")
                )
            }
        }
    }
}
