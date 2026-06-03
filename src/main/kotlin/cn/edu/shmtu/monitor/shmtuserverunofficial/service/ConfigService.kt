package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.SystemConfig
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.SystemConfigRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class ConfigService(
    private val systemConfigRepository: SystemConfigRepository
) {

    fun getAllConfigs(): List<ConfigDto> {
        return systemConfigRepository.findAll().map { it.toDto() }
    }

    fun getConfigByKey(key: String): ConfigDto? {
        return systemConfigRepository.findByConfigKey(key)?.toDto()
    }

    fun getConfigValue(key: String, defaultValue: String? = null): String? {
        val config = systemConfigRepository.findByConfigKey(key)
        return config?.configValue ?: defaultValue
    }

    @Transactional
    fun updateConfig(key: String, request: ConfigUpdateRequest): ConfigDto {
        val config = systemConfigRepository.findByConfigKey(key)
            ?: SystemConfig(configKey = key)

        request.configValue?.let { config.configValue = it }
        request.description?.let { config.description = it }
        config.updatedAt = LocalDateTime.now()

        return systemConfigRepository.save(config).toDto()
    }

    fun getOcrConfig(): OcrConfigDto {
        return OcrConfigDto(
            mode = getConfigValue("ocr.mode", "http") ?: "http",
            tcpHost = getConfigValue("ocr.tcp.host", "localhost") ?: "localhost",
            tcpPort = getConfigValue("ocr.tcp.port", "5000")?.toIntOrNull() ?: 5000,
            httpBaseUrl = getConfigValue("ocr.http.baseUrl", "http://localhost:5001") ?: "http://localhost:5001",
            retryTimes = getConfigValue("ocr.retryTimes", "3")?.toIntOrNull() ?: 3
        )
    }

    @Transactional
    fun updateOcrConfig(request: OcrConfigUpdateRequest): OcrConfigDto {
        request.mode?.let { updateConfig("ocr.mode", ConfigUpdateRequest(it)) }
        request.tcpHost?.let { updateConfig("ocr.tcp.host", ConfigUpdateRequest(it)) }
        request.tcpPort?.let { updateConfig("ocr.tcp.port", ConfigUpdateRequest(it.toString())) }
        request.httpBaseUrl?.let { updateConfig("ocr.http.baseUrl", ConfigUpdateRequest(it)) }
        request.retryTimes?.let { updateConfig("ocr.retryTimes", ConfigUpdateRequest(it.toString())) }
        return getOcrConfig()
    }

    fun getSchedulerConfig(): SchedulerConfigDto {
        return SchedulerConfigDto(
            billSyncEnabled = getConfigValue("scheduler.billSync.enabled", "true")?.toBoolean() ?: true,
            billSyncCron = getConfigValue("scheduler.billSync.cron", "0 0 */2 * * *") ?: "0 0 */2 * * *",
            sessionCheckEnabled = getConfigValue("scheduler.sessionCheck.enabled", "true")?.toBoolean() ?: true,
            sessionCheckCron = getConfigValue("scheduler.sessionCheck.cron", "0 0 * * * *") ?: "0 0 * * * *",
            sessionExpireThreshold = getConfigValue("scheduler.sessionExpireThreshold", "30")?.toIntOrNull() ?: 30
        )
    }

    @Transactional
    fun updateSchedulerConfig(request: SchedulerConfigUpdateRequest): SchedulerConfigDto {
        request.billSyncEnabled?.let { updateConfig("scheduler.billSync.enabled", ConfigUpdateRequest(it.toString())) }
        request.billSyncCron?.let { updateConfig("scheduler.billSync.cron", ConfigUpdateRequest(it)) }
        request.sessionCheckEnabled?.let { updateConfig("scheduler.sessionCheck.enabled", ConfigUpdateRequest(it.toString())) }
        request.sessionCheckCron?.let { updateConfig("scheduler.sessionCheck.cron", ConfigUpdateRequest(it)) }
        request.sessionExpireThreshold?.let { updateConfig("scheduler.sessionExpireThreshold", ConfigUpdateRequest(it.toString())) }
        return getSchedulerConfig()
    }

    private fun SystemConfig.toDto() = ConfigDto(
        id = id,
        configKey = configKey,
        configValue = configValue,
        description = description,
        valueType = valueType
    )
}
