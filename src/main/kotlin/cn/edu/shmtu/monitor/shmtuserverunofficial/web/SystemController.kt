package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import org.springframework.beans.factory.ObjectProvider
import org.springframework.boot.info.BuildProperties
import org.springframework.core.env.Environment
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.time.OffsetDateTime
import javax.sql.DataSource

@RestController
class SystemController(
    private val environment: Environment,
    private val dataSource: DataSource,
    buildPropertiesProvider: ObjectProvider<BuildProperties>,
) {
    private val buildProperties = buildPropertiesProvider.ifAvailable

    @GetMapping("/version")
    fun version(): Map<String, String> = mapOf(
        "application" to environment.getProperty("spring.application.name", "shmtu-server-unofficial"),
        "version" to (buildProperties?.version ?: "dev"),
    )

    @GetMapping("/health")
    fun health(): ResponseEntity<Map<String, Any>> = try {
        dataSource.connection.use { connection ->
            val metadata = connection.metaData
            ResponseEntity.ok(
                mapOf(
                    "status" to "UP",
                    "database" to metadata.databaseProductName,
                    "timestamp" to OffsetDateTime.now().toString(),
                ),
            )
        }
    } catch (ex: Exception) {
        ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            mapOf(
                "status" to "DOWN",
                "error" to (ex.message ?: "Database unavailable"),
                "timestamp" to OffsetDateTime.now().toString(),
            ),
        )
    }
}
