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
