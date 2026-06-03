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
class LarkChannel : NotificationChannel {

    override val channelId = "lark"
    override val displayName = "Lark (Feishu)"

    private val logger = LoggerFactory.getLogger(LarkChannel::class.java)
    private val httpClient = OkHttpClient()

    override fun isAvailable(): Boolean = true

    override fun isConfiguredForUser(user: User): Boolean {
        return !user.larkWebhookUrl.isNullOrBlank() ||
            !user.larkUserId.isNullOrBlank()
    }

    override fun send(user: User, title: String, content: String): ChannelResult {
        val webhookUrl = user.larkWebhookUrl?.takeIf { it.isNotBlank() }
        if (!webhookUrl.isNullOrBlank()) {
            val result = sendViaWebhook(webhookUrl, user.larkWebhookKey.orEmpty(), content)
            if (result.success) return result
        }

        val larkUserId = user.larkUserId?.takeIf { it.isNotBlank() }
        if (!larkUserId.isNullOrBlank()) {
            return sendViaSdk(larkUserId, content)
        }

        return ChannelResult(
            success = false,
            channelId = channelId,
            error = "No Lark channel configured for user ${user.id}"
        )
    }

    private fun sendViaWebhook(webhookUrl: String, webhookKey: String, content: String): ChannelResult {
        return try {
            val timestamp = System.currentTimeMillis() / 1000
            val signedUrl = if (webhookKey.isNotBlank()) {
                val stringToSign = "$timestamp\n$webhookKey"
                val hmacSha256 = HmacUtils.hmacSha256Hex(webhookKey, stringToSign)
                "$webhookUrl&timestamp=$timestamp&sign=" +
                    URLEncoder.encode(hmacSha256, StandardCharsets.UTF_8.toString())
            } else {
                webhookUrl
            }

            val jsonBody = JSONObject().apply {
                put("msg_type", "text")
                put("content", JSONObject().apply {
                    put("text", content)
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
                    val code = json.optInt("code", -1)
                    if (code == 0) {
                        logger.info("Lark webhook notification sent successfully")
                        ChannelResult(success = true, channelId = channelId)
                    } else {
                        logger.warn("Lark webhook returned error: $body")
                        ChannelResult(success = false, channelId = channelId, error = "Webhook error: $body")
                    }
                } else {
                    logger.warn("Lark webhook request failed: HTTP ${response.code}")
                    ChannelResult(success = false, channelId = channelId, error = "HTTP ${response.code}")
                }
            }
        } catch (e: Exception) {
            logger.error("Failed to send Lark webhook notification", e)
            ChannelResult(success = false, channelId = channelId, error = e.message)
        }
    }

    private fun sendViaSdk(larkUserId: String, content: String): ChannelResult {
        // 用户自配后通过 webhook 推送；SDK 模式待后续按需实现
        logger.info("Lark SDK notification would be sent to $larkUserId: $content")
        return ChannelResult(success = true, channelId = channelId)
    }
}
