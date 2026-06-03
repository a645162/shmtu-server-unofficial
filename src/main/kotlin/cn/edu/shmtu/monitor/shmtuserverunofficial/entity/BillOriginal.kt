package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Entity
@Table(
    name = "bill_original",
    indexes = [
        Index(name = "idx_bill_original_account_id", columnList = "account_id"),
        Index(name = "idx_bill_original_bill_date", columnList = "bill_date")
    ],
    uniqueConstraints = [UniqueConstraint(name = "idx_bill_original_transaction_no", columnNames = ["transaction_no"])]
)
class BillOriginal(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "account_id", nullable = false)
    var accountId: Long = 0,

    @Column(name = "transaction_no", nullable = false, length = 100)
    var transactionNo: String = "",

    @Column(name = "bill_date")
    var billDate: LocalDate? = null,

    @Column(name = "bill_time")
    var billTime: LocalTime? = null,

    @Column(name = "bill_type", length = 50)
    var billType: String? = null,

    @Column(name = "target_user", length = 200)
    var targetUser: String? = null,

    @Column(name = "amount", precision = 10, scale = 2)
    var amount: BigDecimal? = null,

    @Column(name = "money", precision = 10, scale = 2)
    var money: BigDecimal? = null,

    @Column(name = "payment_method", length = 100)
    var paymentMethod: String? = null,

    @Column(name = "status", length = 20)
    var status: String? = null,

    @Column(name = "category", length = 30)
    var category: String? = null,

    @Column(name = "position", length = 100)
    var position: String? = null,

    @Column(name = "room", length = 50)
    var room: String? = null,

    @Column(name = "is_new")
    var isNew: Boolean = true,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now()
)
