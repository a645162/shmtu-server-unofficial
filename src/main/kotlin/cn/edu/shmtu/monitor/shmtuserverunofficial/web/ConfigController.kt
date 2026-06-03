package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.ConfigService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/config")
class ConfigController(
    private val configService: ConfigService
) {

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun getAll(): ApiResponse<List<ConfigDto>> {
        return ApiResponse.ok(configService.getAllConfigs())
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    fun update(
        @PathVariable key: String,
        @RequestBody request: ConfigUpdateRequest
    ): ApiResponse<ConfigDto> {
        return ApiResponse.ok(configService.updateConfig(key, request))
    }

    @GetMapping("/ocr")
    @PreAuthorize("hasRole('ADMIN')")
    fun getOcrConfig(): ApiResponse<OcrConfigDto> {
        return ApiResponse.ok(configService.getOcrConfig())
    }

    @PutMapping("/ocr")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateOcrConfig(@RequestBody request: OcrConfigUpdateRequest): ApiResponse<OcrConfigDto> {
        return ApiResponse.ok(configService.updateOcrConfig(request))
    }

    @GetMapping("/scheduler")
    @PreAuthorize("hasRole('ADMIN')")
    fun getSchedulerConfig(): ApiResponse<SchedulerConfigDto> {
        return ApiResponse.ok(configService.getSchedulerConfig())
    }

    @PutMapping("/scheduler")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateSchedulerConfig(@RequestBody request: SchedulerConfigUpdateRequest): ApiResponse<SchedulerConfigDto> {
        return ApiResponse.ok(configService.updateSchedulerConfig(request))
    }
}
