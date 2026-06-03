package cn.edu.shmtu.monitor.shmtuserverunofficial.util

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.AesProperties
import jakarta.annotation.PostConstruct
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

@Component
class AesEncryptUtil(
    private val aesProperties: AesProperties
) {

    private val algorithm = "AES/CBC/PKCS5Padding"
    private val ivLength = 16

    private var secretKey: String = ""

    @PostConstruct
    fun init() {
        secretKey = aesProperties.key
    }

    fun encrypt(plainText: String): String {
        val keySpec = SecretKeySpec(padKey(secretKey), "AES")
        val iv = generateIv()
        val ivSpec = IvParameterSpec(iv)

        val cipher = Cipher.getInstance(algorithm)
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec)

        val encrypted = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        val combined = iv + encrypted

        return Base64.getEncoder().encodeToString(combined)
    }

    fun decrypt(cipherText: String): String {
        val combined = Base64.getDecoder().decode(cipherText)

        val iv = combined.copyOfRange(0, ivLength)
        val encrypted = combined.copyOfRange(ivLength, combined.size)

        val keySpec = SecretKeySpec(padKey(secretKey), "AES")
        val ivSpec = IvParameterSpec(iv)

        val cipher = Cipher.getInstance(algorithm)
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec)

        val decrypted = cipher.doFinal(encrypted)
        return String(decrypted, Charsets.UTF_8)
    }

    private fun padKey(key: String): ByteArray {
        val keyBytes = key.toByteArray(Charsets.UTF_8)
        return if (keyBytes.size >= 32) {
            keyBytes.copyOfRange(0, 32)
        } else {
            keyBytes.copyOf(32)
        }
    }

    private fun generateIv(): ByteArray {
        val iv = ByteArray(ivLength)
        SecureRandom().nextBytes(iv)
        return iv
    }
}
