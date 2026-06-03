package cn.edu.shmtu.monitor.shmtuserverunofficial.dto

data class AuthRequest(
    val username: String,
    val password: String
)

data class RegisterRequest(
    val username: String,
    val password: String,
    val name: String = "",
    val email: String? = null,
    val phone: String? = null
)

data class AuthResponse(
    val token: String,
    val username: String,
    val userId: Long
)

data class UserInfoResponse(
    val id: Long,
    val username: String,
    val name: String,
    val email: String?,
    val phone: String?,
    val enable: Boolean,
    val notificationEnabled: Boolean,
    val larkEnabled: Boolean,
    val wecomEnabled: Boolean,
    val dingtalkEnabled: Boolean,
    val emailEnabled: Boolean,
    val webhookEnabled: Boolean,
    val messageTemplateOverride: String? = null
)

data class PasswordChangeRequest(
    val oldPassword: String,
    val newPassword: String
)
