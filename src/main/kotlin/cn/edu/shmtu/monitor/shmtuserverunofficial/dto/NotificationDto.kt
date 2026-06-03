package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

import java.time.LocalDateTime

data class NotificationDto(
    val id: Long,
    val userId: Long,
    val type: String,
    val title: String?,
    val content: String?,
    val channelId: String?,
    val channelMessageId: String?,
    val status: String,
    val retryCount: Int,
    val sentAt: LocalDateTime?,
    val createdAt: LocalDateTime
)

data class NotificationTestRequest(
    val message: String,
    val channelId: String? = null
)

data class UserNotificationSettingsRequest(
    val notificationEnabled: Boolean? = null,
    val larkEnabled: Boolean? = null,
    val wecomEnabled: Boolean? = null,
    val dingtalkEnabled: Boolean? = null,
    val emailEnabled: Boolean? = null,
    val webhookEnabled: Boolean? = null,
    val larkUserId: String? = null,
    val larkWebhookUrl: String? = null,
    val larkWebhookKey: String? = null,
    val wecomWebhookUrl: String? = null,
    val wecomWebhookKey: String? = null,
    val dingtalkWebhookUrl: String? = null,
    val dingtalkWebhookSecret: String? = null,
    val notificationEmail: String? = null,
    val customWebhookUrl: String? = null,
    val customWebhookHeaders: String? = null,
    val messageTemplateOverride: String? = null
)

data class ChannelInfo(
    val channelId: String,
    val displayName: String,
    val available: Boolean,
    val enabled: Boolean,
    val configuredForUser: Boolean
)

/** Web 端编辑器：拉取 type 对应的系统默认模板源码 */
data class TemplateDefaultResponse(
    val type: String,
    val source: String,
    val placeholders: Map<String, String>
)

/** Web 端编辑器：请求后端校验一段 Handlebars 源码 */
data class TemplateValidateRequest(
    val source: String,
    val type: String = "DEFAULT",
    val sampleTitle: String = "Sample Title",
    val sampleContent: String = "Sample content body"
)

/** Web 端编辑器：返回校验结果 + 渲染后样本 */
data class TemplateValidateResponse(
    val valid: Boolean,
    val rendered: String? = null,
    val error: String? = null
)
