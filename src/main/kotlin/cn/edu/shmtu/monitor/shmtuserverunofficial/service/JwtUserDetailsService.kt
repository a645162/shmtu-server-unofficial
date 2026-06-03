package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.UserRepository
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class JwtUserDetailsService(
    private val userRepository: UserRepository
) : UserDetailsService {

    override fun loadUserByUsername(username: String): UserDetails {
        val userId = username.toLongOrNull()
            ?: throw UsernameNotFoundException("Invalid user identifier: $username")

        val user = userRepository.findById(userId)
            .orElseThrow { UsernameNotFoundException("User not found: $username") }

        return User.builder()
            .username(user.id.toString())
            .password(user.passwordHash)
            .roles("USER")
            .build()
    }
}
