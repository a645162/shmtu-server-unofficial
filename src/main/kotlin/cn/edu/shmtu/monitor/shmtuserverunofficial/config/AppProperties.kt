package cn.edu.shmtu.monitor.shmtuserverunofficial.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "jwt")
class JwtProperties {
    var secret: String = ""
    var expiration: Long = 86400000
}

@Component
@ConfigurationProperties(prefix = "encryption.aes")
class AesProperties {
    var key: String = ""
}

@Component
@ConfigurationProperties(prefix = "ocr")
class OcrProperties {
    /**
     * 多个 OCR 服务器列表，按平均耗时升序动态排序；调用时按序尝试，单台失败立即换下一台，最多试 max-try 台。
     * 内存滑动窗口统计每台最近 windowSize 次的耗时 / 成功率，用于排序；启动时各台排序权重 = initialWeight。
     */
    var servers: List<OcrServerConfig> = emptyList()
    var maxTry: Int = 3
    var perServerTimeoutMs: Long = 3000
    var windowSize: Int = 20
    var initialWeight: Int = 1000  // 未采样时的初始权重（ms），越大排序越靠后

    class OcrServerConfig {
        var name: String = ""
        var mode: String = "http"  // http | tcp
        var enabled: Boolean = true
        var baseUrl: String = ""   // http 模式：例如 http://127.0.0.1:5001
        var host: String = "127.0.0.1"  // tcp 模式
        var port: Int = 5000       // tcp 模式
    }
}

@Component
@ConfigurationProperties(prefix = "scheduler")
class SchedulerProperties {
    val billSync = BillSyncConfig()
    val sessionCheck = SessionCheckConfig()
    var sessionExpireThreshold: Int = 30

    class BillSyncConfig {
        var enabled: Boolean = true
        var cron: String = "0 0 */2 * * *"
    }

    class SessionCheckConfig {
        var enabled: Boolean = true
        var cron: String = "0 0 * * * *"
    }
}
