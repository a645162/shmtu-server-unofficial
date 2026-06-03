package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "operation_log", indexes = [Index(name = "idx_operation_log_user_id", columnList = "user_id")])
class OperationLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "user_id")
    var userId: Long? = null,

    @Column(name = "action", nullable = false, length = 50)
    var action: String = "",

    @Column(name = "target_type", length = 30)
    var targetType: String? = null,

    @Column(name = "target_id")
    var targetId: Long? = null,

    @Column(name = "detail", columnDefinition = "TEXT")
    var detail: String? = null,

    @Column(name = "ip_address", length = 50)
    var ipAddress: String? = null,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)
