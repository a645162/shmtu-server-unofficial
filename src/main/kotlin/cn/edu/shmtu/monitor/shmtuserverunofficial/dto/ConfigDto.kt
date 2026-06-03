package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

data class ConfigDto(
    val id: Long,
    val configKey: String,
    val configValue: String?,
    val description: String?,
    val valueType: String
)

data class ConfigUpdateRequest(
    val configValue: String?,
    val description: String? = null
)

data class OcrConfigDto(
    val mode: String,
    val tcpHost: String,
    val tcpPort: Int,
    val httpBaseUrl: String,
    val retryTimes: Int
)

data class OcrConfigUpdateRequest(
    val mode: String? = null,
    val tcpHost: String? = null,
    val tcpPort: Int? = null,
    val httpBaseUrl: String? = null,
    val retryTimes: Int? = null
)

data class SchedulerConfigDto(
    val billSyncEnabled: Boolean,
    val billSyncCron: String,
    val sessionCheckEnabled: Boolean,
    val sessionCheckCron: String,
    val sessionExpireThreshold: Int
)

data class SchedulerConfigUpdateRequest(
    val billSyncEnabled: Boolean? = null,
    val billSyncCron: String? = null,
    val sessionCheckEnabled: Boolean? = null,
    val sessionCheckCron: String? = null,
    val sessionExpireThreshold: Int? = null
)
