package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

import java.time.LocalDate
import java.time.LocalDateTime

data class AccountDto(
    val id: Long,
    val userId: Long,
    val accountName: String,
    val accountId: String,
    val enable: Boolean,
    val enableUpdate: Boolean,
    val admissionDate: LocalDate?,
    val graduationDate: LocalDate?,
    val expireDate: LocalDate?,
    val lastLoginTime: LocalDateTime?,
    val lastLoginStatus: String?,
    val lastBillSyncTime: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class AccountCreateRequest(
    val accountName: String,
    val accountId: String,
    val password: String,
    val enable: Boolean = true,
    val enableUpdate: Boolean = true,
    val admissionDate: LocalDate? = null,
    val graduationDate: LocalDate? = null,
    val expireDate: LocalDate? = null
)

data class AccountUpdateRequest(
    val accountName: String? = null,
    val password: String? = null,
    val enable: Boolean? = null,
    val enableUpdate: Boolean? = null,
    val admissionDate: LocalDate? = null,
    val graduationDate: LocalDate? = null,
    val expireDate: LocalDate? = null
)
