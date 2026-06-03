package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(
    name = "accounts",
    indexes = [Index(name = "idx_accounts_user_id", columnList = "user_id")],
    uniqueConstraints = [UniqueConstraint(name = "idx_accounts_account_id", columnNames = ["account_id"])]
)
class Account(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "user_id", nullable = false)
    var userId: Long = 0,

    @Column(name = "account_name", nullable = false, length = 100)
    var accountName: String = "",

    @Column(name = "account_id", nullable = false, length = 50)
    var accountId: String = "",

    @Column(name = "password_encrypted", nullable = false, columnDefinition = "TEXT")
    var passwordEncrypted: String = "",

    @Column(name = "enable")
    var enable: Boolean = true,

    @Column(name = "enable_update")
    var enableUpdate: Boolean = true,

    @Column(name = "admission_date")
    var admissionDate: LocalDate? = null,

    @Column(name = "graduation_date")
    var graduationDate: LocalDate? = null,

    @Column(name = "expire_date")
    var expireDate: LocalDate? = null,

    @Column(name = "last_login_time")
    var lastLoginTime: LocalDateTime? = null,

    @Column(name = "last_login_status", length = 20)
    var lastLoginStatus: String? = null,

    @Column(name = "last_bill_sync_time")
    var lastBillSyncTime: LocalDateTime? = null,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
