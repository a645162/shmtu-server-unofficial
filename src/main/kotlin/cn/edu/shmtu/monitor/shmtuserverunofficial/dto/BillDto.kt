package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime

data class BillDto(
    val id: Long,
    val accountId: Long,
    val transactionNo: String,
    val billDate: LocalDate?,
    val billTime: LocalTime?,
    val billType: String?,
    val targetUser: String?,
    val amount: BigDecimal?,
    val money: BigDecimal?,
    val paymentMethod: String?,
    val status: String?,
    val category: String?,
    val position: String?,
    val room: String?,
    val isNew: Boolean
)

data class BillQueryRequest(
    val accountIds: List<Long>? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val category: String? = null,
    val billType: String? = null,
    val isNew: Boolean? = null
)

data class BillStatsDto(
    val totalCount: Long,
    val totalAmount: BigDecimal,
    val newCount: Long,
    val categoryStats: Map<String, CategoryStat>
)

data class CategoryStat(
    val count: Long,
    val totalAmount: BigDecimal
)

data class BillMarkReadRequest(
    val billIds: List<Long>? = null,
    val markAll: Boolean = false
)
