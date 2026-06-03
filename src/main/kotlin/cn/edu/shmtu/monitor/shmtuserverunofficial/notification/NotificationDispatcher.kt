package cn.edu.shmtu.monitor.shmtuserverunofficial.notification

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.ChannelInfo
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel.ChannelResult
import cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel.NotificationChannel
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class NotificationDispatcher(
    private val channels: List<NotificationChannel>,
    private val templateService: TemplateService
) {
    private val logger = LoggerFactory.getLogger(NotificationDispatcher::class.java)
    private val channelMap = channels.associateBy { it.channelId }

    data class DispatchResult(
        val success: Boolean,
        val results: List<ChannelResult>
    )

    fun dispatch(user: User, type: String, title: String, content: String): DispatchResult {
        if (!user.notificationEnabled) {
            return DispatchResult(success = false, results = listOf(
                ChannelResult(success = false, channelId = "none", error = "Notifications disabled for this user")
            ))
        }

        val enabledChannelIds = resolveEnabledChannels(user)

        if (enabledChannelIds.isEmpty()) {
            logger.warn("No notification channel enabled for user ${user.id}")
            return DispatchResult(success = false, results = listOf(
                ChannelResult(success = false, channelId = "none", error = "No channel enabled for user ${user.id}")
            ))
        }

        val rendered = templateService.render(user, type, title, content)

        val results = enabledChannelIds.mapNotNull { channelId ->
            val channel = channelMap[channelId] ?: return@mapNotNull null
            if (!channel.isAvailable() || !channel.isConfiguredForUser(user)) return@mapNotNull null
            try {
                channel.send(user, rendered.title, rendered.content)
            } catch (e: Exception) {
                logger.error("Channel $channelId failed for user ${user.id}", e)
                ChannelResult(success = false, channelId = channelId, error = e.message)
            }
        }

        if (results.isEmpty()) {
            logger.warn("All enabled channels unavailable/unconfigured for user ${user.id}")
        }

        return DispatchResult(success = results.any { it.success }, results = results)
    }

    fun dispatchViaChannel(user: User, channelId: String, type: String, title: String, content: String): ChannelResult {
        val channel = channelMap[channelId]
            ?: return ChannelResult(success = false, channelId = channelId, error = "Unknown channel: $channelId")
        if (!channel.isAvailable()) return ChannelResult(success = false, channelId = channelId, error = "Channel not available")
        if (!channel.isConfiguredForUser(user)) return ChannelResult(success = false, channelId = channelId, error = "Channel not configured for user")
        val rendered = templateService.render(user, type, title, content)
        return channel.send(user, rendered.title, rendered.content)
    }

    fun getConfiguredChannelsForUser(user: User): List<ChannelInfo> {
        return channels.map { channel ->
            ChannelInfo(
                channelId = channel.channelId,
                displayName = channel.displayName,
                available = channel.isAvailable(),
                enabled = isChannelEnabled(user, channel.channelId),
                configuredForUser = channel.isConfiguredForUser(user)
            )
        }
    }

    private fun resolveEnabledChannels(user: User): List<String> {
        val enabled = mutableListOf<String>()
        if (user.larkEnabled) enabled.add("lark")
        if (user.wecomEnabled) enabled.add("wecom")
        if (user.dingtalkEnabled) enabled.add("dingtalk")
        if (user.emailEnabled) enabled.add("email")
        if (user.webhookEnabled) enabled.add("webhook")
        return enabled
    }

    fun isChannelEnabled(user: User, channelId: String): Boolean {
        return when (channelId) {
            "lark" -> user.larkEnabled
            "wecom" -> user.wecomEnabled
            "dingtalk" -> user.dingtalkEnabled
            "email" -> user.emailEnabled
            "webhook" -> user.webhookEnabled
            else -> false
        }
    }
}
