package cn.edu.shmtu.monitor.shmtuserverunofficial.notification

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.NotificationDto
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.NotificationLog
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel.ChannelResult
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.NotificationLogRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class NotificationLogService(
    private val notificationLogRepository: NotificationLogRepository,
    private val userRepository: UserRepository,
    private val notificationDispatcher: NotificationDispatcher
) {
    private val logger = LoggerFactory.getLogger(NotificationLogService::class.java)

    @Transactional
    fun log(userId: Long, type: String, title: String?, content: String?): NotificationLog {
        val notificationLog = NotificationLog(
            userId = userId,
            type = type,
            title = title,
            content = content,
            status = "PENDING"
        )
        return notificationLogRepository.save(notificationLog)
    }

    @Transactional
    fun logChannelResult(notificationLogId: Long, result: ChannelResult) {
        val logEntry = notificationLogRepository.findById(notificationLogId).orElse(null) ?: return
        logEntry.channelId = result.channelId
        logEntry.channelMessageId = result.messageId
        if (result.success) {
            logEntry.status = "SENT"
            logEntry.sentAt = LocalDateTime.now()
        } else {
            logEntry.status = "FAILED"
        }
        notificationLogRepository.save(logEntry)
    }

    @Transactional
    fun markSent(id: Long) {
        val logEntry = notificationLogRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Notification log not found") }
        logEntry.status = "SENT"
        logEntry.sentAt = LocalDateTime.now()
        notificationLogRepository.save(logEntry)
    }

    @Transactional
    fun markFailed(id: Long) {
        val logEntry = notificationLogRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Notification log not found") }
        logEntry.status = "FAILED"
        logEntry.retryCount += 1
        notificationLogRepository.save(logEntry)
    }

    @Transactional
    fun retryPending(maxRetry: Int = 5) {
        val pendingLogs = notificationLogRepository.findByStatusAndRetryCountLessThan("PENDING", maxRetry)
        val failedLogs = notificationLogRepository.findByStatusAndRetryCountLessThan("FAILED", maxRetry)
        val retryCandidates = pendingLogs + failedLogs

        for (logEntry in retryCandidates) {
            try {
                val user = userRepository.findById(logEntry.userId).orElse(null) ?: continue
                val result = notificationDispatcher.dispatch(user, logEntry.type, logEntry.title ?: "", logEntry.content ?: "")
                logEntry.retryCount += 1
                if (result.success) {
                    logEntry.status = "SENT"
                    logEntry.sentAt = LocalDateTime.now()
                    val firstSuccess = result.results.firstOrNull { it.success }
                    logEntry.channelId = firstSuccess?.channelId
                    logEntry.channelMessageId = firstSuccess?.messageId
                }
                notificationLogRepository.save(logEntry)
            } catch (e: Exception) {
                logger.error("Retry notification failed for log ${logEntry.id}", e)
                logEntry.retryCount += 1
                notificationLogRepository.save(logEntry)
            }
        }
    }

    fun listByUser(userId: Long, pageable: Pageable): Page<NotificationDto> {
        val allLogs = notificationLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
        val start = pageable.offset.toInt().coerceAtMost(allLogs.size)
        val end = (start + pageable.pageSize).coerceAtMost(allLogs.size)
        val pageContent = allLogs.subList(start, end).map { it.toDto() }
        return PageImpl(pageContent, pageable, allLogs.size.toLong())
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
