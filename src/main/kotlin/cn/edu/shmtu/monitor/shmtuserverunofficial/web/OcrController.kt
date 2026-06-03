package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OcrService
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/ocr")
class OcrController(
    private val ocrService: OcrService
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
}
