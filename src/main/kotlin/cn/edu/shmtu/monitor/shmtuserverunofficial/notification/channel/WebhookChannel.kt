package cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class WebhookChannel : NotificationChannel {

    override val channelId = "webhook"
    override val displayName = "Custom Webhook"

    private val logger = LoggerFactory.getLogger(WebhookChannel::class.java)
    private val httpClient = OkHttpClient()

    override fun isAvailable(): Boolean = true

    override fun isConfiguredForUser(user: User): Boolean {
        return !user.customWebhookUrl.isNullOrBlank()
    }

    override fun send(user: User, title: String, content: String): ChannelResult {
        val webhookUrl = user.customWebhookUrl?.takeIf { it.isNotBlank() }
            ?: return ChannelResult(
                success = false,
                channelId = channelId,
                error = "No custom webhook URL configured for user ${user.id}"
            )

        return try {
            val jsonBody = JSONObject().apply {
                put("title", title)
                put("content", content)
                put("timestamp", System.currentTimeMillis())
            }

            val requestBody = jsonBody.toString()
                .toRequestBody("application/json".toMediaType())

            val requestBuilder = Request.Builder()
                .url(webhookUrl)
                .post(requestBody)

            user.customWebhookHeaders?.takeIf { it.isNotBlank() }?.let { headersJson ->
                try {
                    val headers = JSONObject(headersJson)
                    for (key in headers.keys()) {
                        requestBuilder.addHeader(key, headers.getString(key))
                    }
                } catch (e: Exception) {
                    logger.warn("Failed to parse custom webhook headers for user ${user.id}", e)
                }
            }

            val request = requestBuilder.build()

            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    logger.info("Custom webhook notification sent successfully to $webhookUrl")
                    ChannelResult(success = true, channelId = channelId)
                } else {
                    logger.warn("Custom webhook request failed: HTTP ${response.code}")
                    ChannelResult(success = false, channelId = channelId, error = "HTTP ${response.code}")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send custom webhook notification", e)
            ChannelResult(success = false, channelId = channelId, error = e.message)
        }
    }
}
