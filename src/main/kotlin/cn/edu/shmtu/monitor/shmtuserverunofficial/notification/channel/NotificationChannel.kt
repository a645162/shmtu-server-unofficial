package cn.edu.shmtu.monitor.shmtuserverunofficial.notification.channel

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User

interface NotificationChannel {
    val channelId: String
    val displayName: String

    fun isAvailable(): Boolean
    fun isConfiguredForUser(user: User): Boolean
    fun send(user: User, title: String, content: String): ChannelResult
}

data class ChannelResult(
    val success: Boolean,
    val channelId: String,
    val messageId: String? = null,
    val error: String? = null
)
