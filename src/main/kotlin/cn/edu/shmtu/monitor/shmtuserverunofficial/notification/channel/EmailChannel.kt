package cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import org.slf4j.LoggerFactory
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Component

@Component
class EmailChannel(
    private val mailSender: JavaMailSender
) : NotificationChannel {

    override val channelId = "email"
    override val displayName = "Email"

    private val logger = LoggerFactory.getLogger(EmailChannel::class.java)

    override fun isAvailable(): Boolean = true

    override fun isConfiguredForUser(user: User): Boolean {
        return !user.notificationEmail.isNullOrBlank()
    }

    override fun send(user: User, title: String, content: String): ChannelResult {
        val email = user.notificationEmail?.takeIf { it.isNotBlank() }
            ?: return ChannelResult(
                success = false,
                channelId = channelId,
                error = "No email configured for user ${user.id}"
            )

        return try {
            val message = SimpleMailMessage().apply {
                from = user.email
                setTo(email)
                subject = title
                text = content
            }
            mailSender.send(message)
            logger.info("Email notification sent to $email")
            ChannelResult(success = true, channelId = channelId)
        } catch (e: Exception) {
            logger.error("Failed to send email notification to $email", e)
            ChannelResult(success = false, channelId = channelId, error = e.message)
        }
    }
}
