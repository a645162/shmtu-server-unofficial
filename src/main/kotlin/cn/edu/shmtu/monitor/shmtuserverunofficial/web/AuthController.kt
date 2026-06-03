package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.AuthService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OperationLogService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    private val operationLogService: OperationLogService
) {

    @PostMapping("/register")
    fun register(@RequestBody request: RegisterRequest): ApiResponse<AuthResponse> {
        val response = authService.register(request)
        operationLogService.log(
            userId = response.userId,
            action = "REGISTER",
            targetType = "USER",
            targetId = response.userId,
            detail = "User registered: ${response.username}"
        )
        return ApiResponse.ok(response)
    }

    @PostMapping("/login")
    fun login(@RequestBody request: AuthRequest): ApiResponse<AuthResponse> {
        val response = authService.login(request)
        operationLogService.log(
            userId = response.userId,
            action = "LOGIN",
            targetType = "USER",
            targetId = response.userId,
            detail = "User logged in: ${response.username}"
        )
        return ApiResponse.ok(response)
    }

    @GetMapping("/me")
    fun getCurrentUser(authentication: Authentication): ApiResponse<UserInfoResponse> {
        val userId = authentication.name.toLong()
        val userInfo = authService.getCurrentUser(userId)
        return ApiResponse.ok(userInfo)
    }

    @PutMapping("/password")
    fun changePassword(
        @RequestBody request: PasswordChangeRequest,
        authentication: Authentication
    ): ApiResponse<Nothing> {
        val userId = authentication.name.toLong()
        authService.changePassword(userId, request)
        operationLogService.log(
            userId = userId,
            action = "CHANGE_PASSWORD",
            targetType = "USER",
            targetId = userId,
            detail = "Password changed"
        )
        return ApiResponse.ok(message = "Password changed successfully")
    }
}
