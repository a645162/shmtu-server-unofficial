package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val data: T? = null
) {
    companion object {
        fun <T> ok(data: T? = null, message: String? = null): ApiResponse<T> =
            ApiResponse(success = true, message = message, data = data)

        fun <T> fail(message: String): ApiResponse<T> =
            ApiResponse(success = false, message = message)
    }
}
