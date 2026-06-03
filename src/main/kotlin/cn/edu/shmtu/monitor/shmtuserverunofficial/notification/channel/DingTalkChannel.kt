package cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.apache.commons.codec.binary.Base64
import org.json.JSONObject
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

@Component
class DingTalkChannel : NotificationChannel {

    override val channelId = "dingtalk"
    override val displayName = "DingTalk"

    private val logger = LoggerFactory.getLogger(DingTalkChannel::class.java)
    private val httpClient = OkHttpClient()

    override fun isAvailable(): Boolean = true

    override fun isConfiguredForUser(user: User): Boolean {
        return !user.dingtalkWebhookUrl.isNullOrBlank()
    }

    override fun send(user: User, title: String, content: String): ChannelResult {
        val webhookUrl = user.dingtalkWebhookUrl?.takeIf { it.isNotBlank() }
            ?: return ChannelResult(
                success = false,
                channelId = channelId,
                error = "No DingTalk webhook URL configured for user ${user.id}"
            )

        return sendViaWebhook(webhookUrl, user.dingtalkWebhookSecret, title, content)
    }

    private fun sendViaWebhook(webhookUrl: String, secret: String?, title: String, content: String): ChannelResult {
        return try {
            val signedUrl = if (!secret.isNullOrBlank()) {
                val timestamp = System.currentTimeMillis()
                val stringToSign = "$timestamp\n$secret"
                val mac = Mac.getInstance("HmacSHA256")
                mac.init(SecretKeySpec(secret.toByteArray(), "HmacSHA256"))
                val signData = mac.doFinal(stringToSign.toByteArray())
                val sign = URLEncoder.encode(Base64().encodeToString(signData), StandardCharsets.UTF_8.toString())
                "$webhookUrl&timestamp=$timestamp&sign=$sign"
            } else {
                webhookUrl
            }

            val textContent = if (title.isNotBlank()) "### $title\n\n$content" else content

            val jsonBody = JSONObject().apply {
                put("msgtype", "markdown")
                put("markdown", JSONObject().apply {
                    put("title", title.ifBlank { "Notification" })
                    put("text", textContent)
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
                        logger.info("DingTalk webhook notification sent successfully")
                        ChannelResult(success = true, channelId = channelId)
                    } else {
                        logger.warn("DingTalk webhook returned error: $body")
                        ChannelResult(success = false, channelId = channelId, error = "DingTalk error: $body")
                    }
                } else {
                    logger.warn("DingTalk webhook request failed: HTTP ${response.code}")
                    ChannelResult(success = false, channelId = channelId, error = "HTTP ${response.code}")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send DingTalk webhook notification", e)
            ChannelResult(success = false, channelId = channelId, error = e.message)
        }
    }
}
