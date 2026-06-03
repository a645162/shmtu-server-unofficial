package cn.edu.shmtu.monitor.shmtuserverunofficial.notification

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.User
import com.github.jknack.handlebars.Handlebars
import com.github.jknack.handlebars.Template
import com.github.jknack.handlebars.io.ClassPathTemplateLoader
import com.github.jknack.handlebars.io.TemplateLoader
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * 通知消息模板服务。
 *
 * 模板来源优先级：
 *   1) user.messageTemplateOverride（用户在 User 表里写的 Handlebars 源码）
 *   2) classpath: templates/notifications/<TYPE>.hbs（系统默认）
 *   3) classpath: templates/notifications/DEFAULT.hbs
 *   4) 代码里硬编码的 fallback（兜底）
 *
 * 支持占位符：
 *   {{title}}, {{content}}, {{type}}, {{timestamp}}
 *   {{user.id}}, {{user.name}}
 */
@Service
class TemplateService {

    private val logger = LoggerFactory.getLogger(TemplateService::class.java)
    private val handlebars: Handlebars
    private val cache = mutableMapOf<String, Template>()

    private val fallbackTemplateSource: String =
        "{{title}}\n\n{{content}}\n\nTime: {{timestamp}}"

    private val timeFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Shanghai"))

    init {
        val loader: TemplateLoader = ClassPathTemplateLoader("/templates/notifications", ".hbs")
        handlebars = Handlebars(loader)
    }

    data class Rendered(val title: String, val content: String)

    data class ValidationResult(
        val valid: Boolean,
        val rendered: String? = null,
        val error: String? = null
    )

    fun render(user: User, type: String, title: String, content: String): Rendered {
        val ctx = mapOf(
            "title" to title,
            "content" to content,
            "type" to type,
            "timestamp" to timeFormatter.format(Instant.now()),
            "user" to mapOf(
                "id" to user.id,
                "name" to user.name
            )
        )

        val templateSource = pickSource(user, type)
        return try {
            val template = compile(templateSource)
            val rendered = template.apply(ctx)
            val parts = rendered.split("\n", limit = 2)
            if (parts.size == 2) {
                Rendered(parts[0].trim(), parts[1].trim())
            } else {
                Rendered(title = title, content = rendered)
            }
        } catch (e: Exception) {
            logger.warn("Template render failed for type=$type, user=${user.id}, fall back to raw text", e)
            Rendered(title = title, content = content)
        }
    }

    private fun pickSource(user: User, type: String): String {
        val override = user.messageTemplateOverride?.takeIf { it.isNotBlank() }
        if (override != null) return override

        val fromClasspath = readClasspathTemplate(type)
        if (fromClasspath != null) return fromClasspath

        logger.debug("No template for type=$type, use DEFAULT")
        val fromDefault = readClasspathTemplate("DEFAULT")
        if (fromDefault != null) return fromDefault

        logger.warn("No DEFAULT template found, use hardcoded fallback")
        return fallbackTemplateSource
    }

    /**
     * 从 classpath 读取 .hbs 模板源码。读不到返回 null（让上层回退到 DEFAULT）。
     */
    private fun readClasspathTemplate(name: String): String? {
        val path = "/templates/notifications/$name.hbs"
        return try {
            val stream = TemplateService::class.java.getResourceAsStream(path) ?: return null
            stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        } catch (e: Exception) {
            logger.debug("Failed to read classpath template $path", e)
            null
        }
    }

    private fun compile(source: String): Template {
        val key = Integer.toHexString(source.hashCode())
        return cache.getOrPut(key) { handlebars.compileInline(source) }
    }

    // ============= 公开辅助方法（给 Controller 暴露能力） =============

    /**
     * 返回 type 对应的 classpath 模板源码（不含用户的 override）。
     * 用于 Web 端"从默认模板开始"按钮：用户点一下，前端拿到默认全文做起点。
     */
    fun readDefaultSource(type: String): String? {
        return readClasspathTemplate(type) ?: readClasspathTemplate("DEFAULT") ?: fallbackTemplateSource
    }

    /**
     * 列出所有可用的占位符 + 示例，供前端编辑器提示用。
     */
    fun supportedPlaceholders(): Map<String, String> = mapOf(
        "title" to "原始标题，例如 'Session Re-login Failed'",
        "content" to "原始正文",
        "type" to "通知类型，例如 BILL_SYNC / SESSION_EXPIRED / LOGIN_FAIL / NEW_BILL / SYNC_ERROR / TEST",
        "timestamp" to "渲染时间 (Asia/Shanghai, yyyy-MM-dd HH:mm:ss)",
        "user.id" to "用户 ID",
        "user.name" to "用户显示名"
    )

    /**
     * 用给定的模板源码和样本 ctx 渲染一次，做语法/上下文校验。
     * 渲染成功返回 rendered 字符串，失败返回 error。
     */
    fun validate(source: String, type: String, title: String, content: String, user: User): ValidationResult {
        val ctx = mapOf(
            "title" to title,
            "content" to content,
            "type" to type,
            "timestamp" to timeFormatter.format(Instant.now()),
            "user" to mapOf(
                "id" to user.id,
                "name" to user.name
            )
        )
        return try {
            val rendered = handlebars.compileInline(source).apply(ctx)
            ValidationResult(valid = true, rendered = rendered)
        } catch (e: Exception) {
            ValidationResult(valid = false, error = e.message ?: e::class.java.simpleName)
        }
    }
}
