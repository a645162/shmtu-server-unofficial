package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.NotificationLog
import cn.edu.shmtu.monitor.shmtuserverunofficial.notification.NotificationDispatcher
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.NotificationLogRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class NotificationService(
    private val notificationLogRepository: NotificationLogRepository,
    private val userRepository: UserRepository,
    private val notificationDispatcher: NotificationDispatcher
) {
    private val logger = LoggerFactory.getLogger(NotificationService::class.java)

    fun listByUserId(userId: Long): List<NotificationDto> {
        return notificationLogRepository.findByUserIdOrderByCreatedAtDesc(userId).map { it.toDto() }
    }

    @Transactional
    fun sendNotification(
        userId: Long,
        type: String,
        title: String?,
        content: String
    ): NotificationLog {
        val user = userRepository.findById(userId).orElse(null)
        if (user == null || !user.notificationEnabled) {
            val log = NotificationLog(
                userId = userId,
                type = type,
                title = title,
                content = content,
                status = "FAILED"
            )
            return notificationLogRepository.save(log)
        }

        val log = NotificationLog(
            userId = userId,
            type = type,
            title = title,
            content = content,
            status = "PENDING"
        )
        val savedLog = notificationLogRepository.save(log)

        try {
            val result = notificationDispatcher.dispatch(user, type, title ?: "", content)

            val firstSuccess = result.results.firstOrNull { it.success }
            savedLog.channelId = firstSuccess?.channelId ?: result.results.firstOrNull()?.channelId
            savedLog.channelMessageId = firstSuccess?.messageId
            savedLog.status = if (result.success) "SENT" else "FAILED"
            if (result.success) {
                savedLog.sentAt = LocalDateTime.now()
            }
            notificationLogRepository.save(savedLog)
        } catch (e: Exception) {
            logger.error("Failed to send notification to user $userId", e)
            savedLog.status = "FAILED"
            notificationLogRepository.save(savedLog)
        }

        return savedLog
    }

    @Transactional
    fun sendTestNotification(userId: Long, message: String, channelId: String?): Boolean {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        return if (channelId != null) {
            notificationDispatcher.dispatchViaChannel(user, channelId, "TEST", "Test Notification", message).success
        } else {
            notificationDispatcher.dispatch(user, "TEST", "Test Notification", message).success
        }
    }

    @Transactional
    fun updateUserNotificationSettings(userId: Long, request: UserNotificationSettingsRequest) {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        request.notificationEnabled?.let { user.notificationEnabled = it }
        request.larkEnabled?.let { user.larkEnabled = it }
        request.wecomEnabled?.let { user.wecomEnabled = it }
        request.dingtalkEnabled?.let { user.dingtalkEnabled = it }
        request.emailEnabled?.let { user.emailEnabled = it }
        request.webhookEnabled?.let { user.webhookEnabled = it }
        request.larkUserId?.let { user.larkUserId = it }
        request.larkWebhookUrl?.let { user.larkWebhookUrl = it }
        request.larkWebhookKey?.let { user.larkWebhookKey = it }
        request.wecomWebhookUrl?.let { user.wecomWebhookUrl = it }
        request.wecomWebhookKey?.let { user.wecomWebhookKey = it }
        request.dingtalkWebhookUrl?.let { user.dingtalkWebhookUrl = it }
        request.dingtalkWebhookSecret?.let { user.dingtalkWebhookSecret = it }
        request.notificationEmail?.let { user.notificationEmail = it }
        request.customWebhookUrl?.let { user.customWebhookUrl = it }
        request.customWebhookHeaders?.let { user.customWebhookHeaders = it }
        user.updatedAt = LocalDateTime.now()

        userRepository.save(user)
    }

    fun getAvailableChannelsForUser(userId: Long): List<ChannelInfo> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }
        return notificationDispatcher.getConfiguredChannelsForUser(user)
    }

    private fun NotificationLog.toDto() = NotificationDto(
        id = id,
        userId = userId,
        type = type,
        title = title,
        content = content,
        channelId = channelId,
        channelMessageId = channelMessageId,
        status = status,
        retryCount = retryCount,
        sentAt = sentAt,
        createdAt = createdAt
    )
}
