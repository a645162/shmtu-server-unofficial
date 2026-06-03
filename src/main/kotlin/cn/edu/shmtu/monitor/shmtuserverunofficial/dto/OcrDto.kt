package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

data class OcrRecognizeRequest(
    val imageBase64: String
)

data class OcrRecognizeResponse(
    val success: Boolean,
    val expression: String?,
    val result: String?,
    val error: String? = null
)

data class OcrStatusResponse(
    val available: Boolean,
    val mode: String,
    val lastCheckTime: String?
)

/** 单台 OCR 服务器的实时状态（供管理/监控 UI 展示） */
data class OcrServerStatus(
    val name: String,
    val mode: String,
    val enabled: Boolean,
    val address: String,
    val avgLatencyMs: Double,
    val successRate: Double,
    val sampleCount: Int
)
