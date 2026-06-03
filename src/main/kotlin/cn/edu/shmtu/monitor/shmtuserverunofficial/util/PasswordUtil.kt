package cn.edu.shmtu.monitor.shmtuserverunofficial.util

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Component

@Component
class PasswordUtil {

    private val encoder = BCryptPasswordEncoder()

    fun hashPassword(rawPassword: String): String {
        return encoder.encode(rawPassword) ?: throw RuntimeException("Failed to hash password")
    }

    fun matches(rawPassword: String, encodedPassword: String): Boolean {
        return encoder.matches(rawPassword, encodedPassword)
    }
}
