package cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.apache.commons.codec.digest.HmacUtils
import org.json.JSONObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Component
class WeComChannel : NotificationChannel {

    override val channelId = "wecom"
    override val displayName = "WeCom (WeChat Work)"

    private val logger = LoggerFactory.getLogger(WeComChannel::class.java)
    private val httpClient = OkHttpClient()

    override fun isAvailable(): Boolean = true

    override fun isConfiguredForUser(user: User): Boolean {
        return !user.wecomWebhookUrl.isNullOrBlank()
    }

    override fun send(user: User, title: String, content: String): ChannelResult {
        val webhookUrl = user.wecomWebhookUrl?.takeIf { it.isNotBlank() }
            ?: return ChannelResult(
                success = false,
                channelId = channelId,
                error = "No WeCom webhook URL configured for user ${user.id}"
            )

        return sendViaWebhook(webhookUrl, user.wecomWebhookKey, title, content)
    }

    private fun sendViaWebhook(webhookUrl: String, webhookKey: String?, title: String, content: String): ChannelResult {
        return try {
            val signedUrl = if (!webhookKey.isNullOrBlank()) {
                val timestamp = System.currentTimeMillis() / 1000
                val stringToSign = "$timestamp\n$webhookKey"
                val sign = HmacUtils.hmacSha256Hex(webhookKey, stringToSign)
                "$webhookUrl&timestamp=$timestamp&sign=" +
                    URLEncoder.encode(sign, StandardCharsets.UTF_8.toString())
            } else {
                webhookUrl
            }

            val textContent = if (title.isNotBlank()) "**$title**\n\n$content" else content

            val jsonBody = JSONObject().apply {
                put("msgtype", "markdown")
                put("markdown", JSONObject().apply {
                    put("content", textContent)
                })
            }

            val requestBody = jsonBody.toString()
                .toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url(signedUrl)
                .post(requestBody)
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body.string()
                    val json = JSONObject(body)
                    val errcode = json.optInt("errcode", -1)
                    if (errcode == 0) {
                        logger.info("WeCom webhook notification sent successfully")
                        ChannelResult(success = true, channelId = channelId)
                    } else {
                        logger.warn("WeCom webhook returned error: $body")
                        ChannelResult(success = false, channelId = channelId, error = "WeCom error: $body")
                    }
                } else {
                    logger.warn("WeCom webhook request failed: HTTP ${response.code}")
                    ChannelResult(success = false, channelId = channelId, error = "HTTP ${response.code}")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send WeCom webhook notification", e)
            ChannelResult(success = false, channelId = channelId, error = e.message)
        }
    }
}
