package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.UserRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.util.JwtUtil
import cn.edu.shmtu.monitor.shmtuserverunofficial.util.PasswordUtil
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordUtil: PasswordUtil,
    private val jwtUtil: JwtUtil
) {

    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        if (userRepository.existsByUsername(request.username)) {
            throw IllegalArgumentException("Username already exists")
        }

        val user = User(
            username = request.username,
            passwordHash = passwordUtil.hashPassword(request.password),
            name = request.name.ifBlank { request.username },
            email = request.email,
            phone = request.phone
        )
        val savedUser = userRepository.save(user)
        val token = jwtUtil.generateToken(savedUser.id, savedUser.username)

        return AuthResponse(
            token = token,
            username = savedUser.username,
            userId = savedUser.id
        )
    }

    fun login(request: AuthRequest): AuthResponse {
        val user = userRepository.findByUsername(request.username)
            ?: throw IllegalArgumentException("Invalid username or password")

        if (!passwordUtil.matches(request.password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid username or password")
        }

        val token = jwtUtil.generateToken(user.id, user.username)

        return AuthResponse(
            token = token,
            username = user.username,
            userId = user.id
        )
    }

    fun getCurrentUser(userId: Long): UserInfoResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        return UserInfoResponse(
            id = user.id,
            username = user.username,
            name = user.name,
            email = user.email,
            phone = user.phone,
            enable = user.enable,
            notificationEnabled = user.notificationEnabled,
            larkEnabled = user.larkEnabled,
            wecomEnabled = user.wecomEnabled,
            dingtalkEnabled = user.dingtalkEnabled,
            emailEnabled = user.emailEnabled,
            webhookEnabled = user.webhookEnabled
        )
    }

    @Transactional
    fun changePassword(userId: Long, request: PasswordChangeRequest) {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (!passwordUtil.matches(request.oldPassword, user.passwordHash)) {
            throw IllegalArgumentException("Old password is incorrect")
        }

        user.passwordHash = passwordUtil.hashPassword(request.newPassword)
        user.updatedAt = LocalDateTime.now()
        userRepository.save(user)
    }

    fun getUserIdByUsername(username: String): Long {
        val user = userRepository.findByUsername(username)
            ?: throw IllegalArgumentException("User not found")
        return user.id
    }
}
