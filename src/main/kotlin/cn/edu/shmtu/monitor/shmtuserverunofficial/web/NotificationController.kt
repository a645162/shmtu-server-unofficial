package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.NotificationService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class NotificationController(
    private val notificationService: NotificationService
) {

    @GetMapping("/notifications")
    fun list(authentication: Authentication): ApiResponse<List<NotificationDto>> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(notificationService.listByUserId(userId))
    }

    @GetMapping("/notifications/channels")
    fun getChannels(authentication: Authentication): ApiResponse<List<ChannelInfo>> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(notificationService.getAvailableChannelsForUser(userId))
    }

    @PostMapping("/notifications/test")
    fun testNotification(
        @RequestBody request: NotificationTestRequest,
        authentication: Authentication
    ): ApiResponse<Map<String, Boolean>> {
        val userId = authentication.name.toLong()
        val success = notificationService.sendTestNotification(userId, request.message, request.channelId)
        return ApiResponse.ok(mapOf("success" to success))
    }

    @PutMapping("/notifications/settings")
    fun updateSettings(
        @RequestBody request: UserNotificationSettingsRequest,
        authentication: Authentication
    ): ApiResponse<Nothing> {
        val userId = authentication.name.toLong()
        notificationService.updateUserNotificationSettings(userId, request)
        return ApiResponse.ok(message = "Notification settings updated")
    }

    // ============= 模板编辑器接口 =============

    @GetMapping("/notifications/templates/default")
    fun getDefaultTemplate(
        @RequestParam("type", defaultValue = "DEFAULT") type: String,
        authentication: Authentication
    ): ApiResponse<TemplateDefaultResponse> {
        authentication.name.toLong()  // ensure authenticated
        return ApiResponse.ok(notificationService.getDefaultTemplate(type))
    }

    @PostMapping("/notifications/templates/validate")
    fun validateTemplate(
        @RequestBody request: TemplateValidateRequest,
        authentication: Authentication
    ): ApiResponse<TemplateValidateResponse> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(notificationService.validateTemplate(userId, request))
    }

    @DeleteMapping("/notifications/templates/override")
    fun clearOverride(authentication: Authentication): ApiResponse<Nothing> {
        val userId = authentication.name.toLong()
        notificationService.clearUserTemplateOverride(userId)
        return ApiResponse.ok(message = "Custom message template cleared, system default will be used")
    }
}
