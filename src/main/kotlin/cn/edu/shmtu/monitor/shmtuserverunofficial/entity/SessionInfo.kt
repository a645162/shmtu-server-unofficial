package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "session_info", indexes = [Index(name = "idx_session_info_account_id", columnList = "account_id")])
class SessionInfo(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "account_id", nullable = false)
    var accountId: Long = 0,

    @Column(name = "cookies", columnDefinition = "TEXT")
    var cookies: String? = null,

    @Column(name = "login_time")
    var loginTime: LocalDateTime? = null,

    @Column(name = "expire_time")
    var expireTime: LocalDateTime? = null,

    @Column(name = "is_valid")
    var isValid: Boolean = false,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
