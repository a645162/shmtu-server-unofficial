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
    var mode: String = "http"
    val tcp = TcpConfig()
    val http = HttpConfig()
    var retryTimes: Int = 3

    class TcpConfig {
        var host: String = "localhost"
        var port: Int = 5000
    }

    class HttpConfig {
        var baseUrl: String = "http://localhost:5001"
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
