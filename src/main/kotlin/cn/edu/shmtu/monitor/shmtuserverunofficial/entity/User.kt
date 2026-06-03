package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "username", nullable = false, unique = true, length = 50)
    var username: String = "",

    @Column(name = "password_hash", nullable = false, length = 255)
    var passwordHash: String = "",

    @Column(name = "name", nullable = false, length = 100)
    var name: String = "",

    @Column(name = "email", length = 100)
    var email: String? = null,

    @Column(name = "phone", length = 20)
    var phone: String? = null,

    @Column(name = "enable")
    var enable: Boolean = true,

    @Column(name = "enable_update")
    var enableUpdate: Boolean = true,

    @Column(name = "birthday", length = 20)
    var birthday: String? = null,

    // Notification master switch
    @Column(name = "notification_enabled")
    var notificationEnabled: Boolean = true,

    // 5 independent channel switches (parallel push)
    @Column(name = "lark_enabled")
    var larkEnabled: Boolean = false,

    @Column(name = "wecom_enabled")
    var wecomEnabled: Boolean = false,

    @Column(name = "dingtalk_enabled")
    var dingtalkEnabled: Boolean = false,

    @Column(name = "email_enabled")
    var emailEnabled: Boolean = false,

    @Column(name = "webhook_enabled")
    var webhookEnabled: Boolean = false,

    // Lark channel config
    @Column(name = "lark_user_id", length = 100)
    var larkUserId: String? = null,

    @Column(name = "lark_webhook_url", length = 500)
    var larkWebhookUrl: String? = null,

    @Column(name = "lark_webhook_key", length = 100)
    var larkWebhookKey: String? = null,

    // WeCom channel config
    @Column(name = "wecom_webhook_url", length = 500)
    var wecomWebhookUrl: String? = null,

    @Column(name = "wecom_webhook_key", length = 100)
    var wecomWebhookKey: String? = null,

    // DingTalk channel config
    @Column(name = "dingtalk_webhook_url", length = 500)
    var dingtalkWebhookUrl: String? = null,

    @Column(name = "dingtalk_webhook_secret", length = 100)
    var dingtalkWebhookSecret: String? = null,

    // Email channel config
    @Column(name = "notification_email", length = 100)
    var notificationEmail: String? = null,

    // Custom Webhook channel config
    @Column(name = "custom_webhook_url", length = 500)
    var customWebhookUrl: String? = null,

    @Column(name = "custom_webhook_headers", columnDefinition = "TEXT")
    var customWebhookHeaders: String? = null,

    // 用户级消息模板（Handlebars 源码）。为空时回退到 classpath: templates/notifications/<TYPE>.hbs。
    @Column(name = "message_template_override", columnDefinition = "TEXT")
    var messageTemplateOverride: String? = null,

    @Column(name = "created_at", updatable = false)
    var createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
