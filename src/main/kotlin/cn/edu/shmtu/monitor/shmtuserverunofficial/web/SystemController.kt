package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.CasSyncService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OperationLogService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OcrService
import org.springframework.beans.factory.ObjectProvider
import org.springframework.boot.info.BuildProperties
import org.springframework.core.env.Environment
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.lang.management.ManagementFactory
import javax.sql.DataSource

@RestController
class SystemController(
    private val environment: Environment,
    private val dataSource: DataSource,
    private val casSyncService: CasSyncService,
    private val operationLogService: OperationLogService,
    private val ocrService: OcrService,
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
                    "timestamp" to java.time.OffsetDateTime.now().toString(),
                ),
            )
        }
    } catch (ex: Exception) {
        ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
            mapOf(
                "status" to "DOWN",
                "error" to (ex.message ?: "Database unavailable"),
                "timestamp" to java.time.OffsetDateTime.now().toString(),
            ),
        )
    }

    @GetMapping("/api/system/health")
    fun systemHealth(): ApiResponse<SystemHealthResponse> {
        val runtime = ManagementFactory.getRuntimeMXBean()
        val uptime = runtime.uptime

        val ocrStatus = ocrService.getStatus()
        val dbStatus = try {
            "UP"
        } catch (e: Exception) {
            "DOWN"
        }

        return ApiResponse.ok(SystemHealthResponse(
            status = "UP",
            database = dbStatus,
            ocrService = if (ocrStatus.available) "UP" else "DOWN",
            uptime = uptime
        ))
    }

    @GetMapping("/api/system/stats")
    @PreAuthorize("hasRole('ADMIN')")
    fun stats(): ApiResponse<SystemStatsResponse> {
        return ApiResponse.ok(SystemStatsResponse(
            totalUsers = 0,
            totalAccounts = 0,
            totalBills = 0,
            newBillsCount = 0,
            totalNotifications = 0
        ))
    }

    @GetMapping("/api/system/logs")
    @PreAuthorize("hasRole('ADMIN')")
    fun logs(pageable: Pageable): ApiResponse<PageResponse<OperationLogDto>> {
        val page = operationLogService.queryAll(pageable)
        return ApiResponse.ok(PageResponse(
            content = page.content,
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            currentPage = page.number,
            pageSize = page.size
        ))
    }

    @PostMapping("/api/system/sync-all")
    @PreAuthorize("hasRole('ADMIN')")
    fun syncAll(): ApiResponse<Map<String, Int>> {
        val newCount = casSyncService.syncAll()
        return ApiResponse.ok(mapOf("newBills" to newCount))
    }
}
