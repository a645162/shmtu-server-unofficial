package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.BillService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/bills")
class BillController(
    private val billService: BillService
) {

    @GetMapping
    fun queryBills(
        @RequestParam(required = false) accountIds: List<Long>?,
        @RequestParam(required = false) startDate: java.time.LocalDate?,
        @RequestParam(required = false) endDate: java.time.LocalDate?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) billType: String?,
        @RequestParam(required = false) isNew: Boolean?,
        authentication: Authentication
    ): ApiResponse<List<BillDto>> {
        val userId = authentication.name.toLong()
        val request = BillQueryRequest(
            accountIds = accountIds,
            startDate = startDate,
            endDate = endDate,
            category = category,
            billType = billType,
            isNew = isNew
        )
        return ApiResponse.ok(billService.queryBills(userId, request))
    }

    @GetMapping("/stats")
    fun getStats(
        @RequestParam(required = false) accountIds: List<Long>?,
        authentication: Authentication
    ): ApiResponse<BillStatsDto> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(billService.getBillStats(userId, accountIds))
    }

    @GetMapping("/new-count")
    fun getNewBillsCount(authentication: Authentication): ApiResponse<Map<String, Long>> {
        val userId = authentication.name.toLong()
        val count = billService.getNewBillsCount(userId)
        return ApiResponse.ok(mapOf("count" to count))
    }

    @GetMapping("/new")
    fun getNewBills(authentication: Authentication): ApiResponse<List<BillDto>> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(billService.getNewBills(userId))
    }

    @PostMapping("/mark-read")
    fun markAsRead(
        @RequestBody request: BillMarkReadRequest,
        authentication: Authentication
    ): ApiResponse<Nothing> {
        val userId = authentication.name.toLong()
        billService.markAsRead(userId, request)
        return ApiResponse.ok(message = "Bills marked as read")
    }
}
