package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OcrServerRegistry
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OcrService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ocr")
class OcrController(
    private val ocrService: OcrService,
    private val ocrServerRegistry: OcrServerRegistry
) {

    @PostMapping("/recognize")
    fun recognize(@RequestBody request: OcrRecognizeRequest): ApiResponse<OcrRecognizeResponse> {
        val result = ocrService.recognize(request)
        return if (result.success) {
            ApiResponse.ok(result)
        } else {
            ApiResponse.fail(result.error ?: "OCR recognition failed")
        }
    }

    @GetMapping("/status")
    fun status(): ApiResponse<OcrStatusResponse> {
        return ApiResponse.ok(ocrService.getStatus())
    }

    /** 列出所有已配置 OCR 服务器的实时状态（按平均耗时升序）。管理员可见。 */
    @GetMapping("/servers")
    @PreAuthorize("hasRole('ADMIN')")
    fun listServers(): ApiResponse<List<OcrServerStatus>> {
        return ApiResponse.ok(ocrServerRegistry.toStatusDtos())
    }

    /** 清空所有 OCR 服务器的运行时统计（重置排序权重）。管理员可见。 */
    @PostMapping("/servers/reset-stats")
    @PreAuthorize("hasRole('ADMIN')")
    fun resetStats(): ApiResponse<Nothing> {
        ocrServerRegistry.reset()
        return ApiResponse.ok(message = "OCR server statistics cleared")
    }
}
