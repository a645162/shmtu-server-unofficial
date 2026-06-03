package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrRecognizeRequest
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrRecognizeResponse
import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrStatusResponse
import cn.edu.shmtu.monitor.shmtuserverunofficial.config.OcrProperties
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

@Service
class OcrService(
    private val ocrProperties: OcrProperties
) {
    private val logger = LoggerFactory.getLogger(OcrService::class.java)
    private val httpClient = OkHttpClient()
    private var lastCheckTime: LocalDateTime? = null
    private var lastCheckAvailable: Boolean = false

    fun recognize(request: OcrRecognizeRequest): OcrRecognizeResponse {
        return when (ocrProperties.mode.lowercase()) {
            "tcp" -> recognizeViaTcp(request.imageBase64)
            "http" -> recognizeViaHttp(request.imageBase64)
            else -> recognizeViaHttp(request.imageBase64)
        }
    }

    fun getStatus(): OcrStatusResponse {
        val available = checkAvailability()
        return OcrStatusResponse(
            available = available,
            mode = ocrProperties.mode,
            lastCheckTime = lastCheckTime?.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        )
    }

    private fun recognizeViaTcp(imageBase64: String): OcrRecognizeResponse {
        var retries = 0
        var lastException: Exception? = null

        while (retries < ocrProperties.retryTimes) {
            try {
                val imageBytes = java.util.Base64.getDecoder().decode(imageBase64)
                val socket = Socket()
                socket.connect(
                    java.net.InetSocketAddress(ocrProperties.tcp.host, ocrProperties.tcp.port),
                    5000
                )
                socket.soTimeout = 10000

                val outputStream: OutputStream = socket.getOutputStream()
                val inputStream: InputStream = socket.getInputStream()

                outputStream.write(imageBytes)
                outputStream.write("<END>".toByteArray(Charsets.UTF_8))
                outputStream.flush()

                val buffer = ByteArray(1024)
                val bytesRead = inputStream.read(buffer)
                val result = if (bytesRead > 0) {
                    String(buffer, 0, bytesRead, Charsets.UTF_8).trim()
                } else {
                    ""
                }

                socket.close()

                if (result.isNotEmpty()) {
                    return OcrRecognizeResponse(
                        success = true,
                        expression = result,
                        result = result
                    )
                }
            } catch (e: Exception) {
                lastException = e
                logger.warn("TCP OCR attempt ${retries + 1} failed: ${e.message}")
            }
            retries++
        }

        return OcrRecognizeResponse(
            success = false,
            expression = null,
            result = null,
            error = "TCP OCR failed after $retries retries: ${lastException?.message}"
        )
    }

    private fun recognizeViaHttp(imageBase64: String): OcrRecognizeResponse {
        var retries = 0
        var lastException: Exception? = null

        while (retries < ocrProperties.retryTimes) {
            try {
                val jsonBody = JSONObject().apply {
                    put("imageBase64", imageBase64)
                }

                val requestBody = jsonBody.toString()
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url("${ocrProperties.http.baseUrl}/api/ocr")
                    .post(requestBody)
                    .build()

                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw RuntimeException("HTTP ${response.code}")
                    }

                    val responseBody = response.body?.string() ?: ""
                    val json = JSONObject(responseBody)

                    val success = json.optBoolean("success", false)
                    if (success) {
                        return OcrRecognizeResponse(
                            success = true,
                            expression = json.optString("expression", null),
                            result = json.optString("result", null)
                        )
                    } else {
                        return OcrRecognizeResponse(
                            success = false,
                            expression = null,
                            result = null,
                            error = json.optString("error", "Unknown error")
                        )
                    }
                }
            } catch (e: Exception) {
                lastException = e
                logger.warn("HTTP OCR attempt ${retries + 1} failed: ${e.message}")
            }
            retries++
        }

        return OcrRecognizeResponse(
            success = false,
            expression = null,
            result = null,
            error = "HTTP OCR failed after $retries retries: ${lastException?.message}"
        )
    }

    private fun checkAvailability(): Boolean {
        return try {
            when (ocrProperties.mode.lowercase()) {
                "tcp" -> {
                    val socket = Socket()
                    socket.connect(
                        java.net.InetSocketAddress(ocrProperties.tcp.host, ocrProperties.tcp.port),
                        3000
                    )
                    socket.close()
                    true
                }
                "http" -> {
                    val request = Request.Builder()
                        .url("${ocrProperties.http.baseUrl}/api/ocr/status")
                        .get()
                        .build()
                    httpClient.newCall(request).execute().use { it.isSuccessful }
                }
                else -> false
            }.also {
                lastCheckAvailable = it
                lastCheckTime = LocalDateTime.now()
            }
        } catch (e: Exception) {
            lastCheckAvailable = false
            lastCheckTime = LocalDateTime.now()
            false
        }
    }
}
