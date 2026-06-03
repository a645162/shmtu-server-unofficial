package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

import java.time.LocalDateTime

data class SessionDto(
    val id: Long,
    val accountId: Long,
    val loginTime: LocalDateTime?,
    val expireTime: LocalDateTime?,
    val isValid: Boolean,
    val updatedAt: LocalDateTime
)

data class SystemHealthResponse(
    val status: String,
    val database: String,
    val ocrService: String,
    val uptime: Long
)

data class SystemStatsResponse(
    val totalUsers: Long,
    val totalAccounts: Long,
    val totalBills: Long,
    val newBillsCount: Long,
    val totalNotifications: Long
)

data class OperationLogDto(
    val id: Long,
    val userId: Long?,
    val action: String,
    val targetType: String?,
    val targetId: Long?,
    val detail: String?,
    val ipAddress: String?,
    val createdAt: String
)

data class PageResponse<T>(
    val content: List<T>,
    val totalElements: Long,
    val totalPages: Int,
    val currentPage: Int,
    val pageSize: Int
)
