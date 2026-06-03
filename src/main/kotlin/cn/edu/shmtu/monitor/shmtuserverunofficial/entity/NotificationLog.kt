package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "notification_log",
    indexes = [
        Index(name = "idx_notification_log_user_id", columnList = "user_id"),
        Index(name = "idx_notification_log_status", columnList = "status")
    ]
)
class NotificationLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "type", nullable = false, length = 30)
    var type: String = "",

    @Column(name = "title", length = 200)
    var title: String? = null,

    @Column(name = "content", columnDefinition = "TEXT")
    var content: String? = null,

    @Column(name = "channel_id", length = 30)
    var channelId: String? = null,

    @Column(name = "channel_message_id", length = 200)
    var channelMessageId: String? = null,

    @Column(name = "status", length = 20)
    var status: String = "PENDING",

    @Column(name = "retry_count")
    var retryCount: Int = 0,

    @Column(name = "sent_at")
    var sentAt: LocalDateTime? = null,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)
