package cn.edu.shmtu.monitor.shmtuserverunofficial.util

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.JwtProperties
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.Date

@Component
class JwtUtil(
    private val jwtProperties: JwtProperties
) {
    private val signingKey by lazy {
        val keyBytes = jwtProperties.secret.toByteArray(Charsets.UTF_8)
        Keys.hmacShaKeyFor(keyBytes.copyOf(32))
    }

    fun generateToken(userId: Long, username: String): String {
        val now = Date()
        val expiryDate = Date(now.time + jwtProperties.expiration)

        return Jwts.builder()
            .subject(userId.toString())
            .claim("username", username)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(signingKey)
            .compact()
    }

    fun getUserIdFromToken(token: String): Long {
        val claims = parseToken(token)
        return claims.subject.toLong()
    }

    fun getUsernameFromToken(token: String): String {
        val claims = parseToken(token)
        return claims.get("username", String::class.java)
    }

    fun validateToken(token: String): Boolean {
        return try {
            parseToken(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun parseToken(token: String): Claims {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
    }
}
