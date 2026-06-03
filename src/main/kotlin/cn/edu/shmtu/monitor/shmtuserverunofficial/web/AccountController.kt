package cn.edu.shmtu.monitor.shmtuserverunofficial.web

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.SessionInfo
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.SessionInfoRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.AccountService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.CasSyncService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.OperationLogService
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService,
    private val casSyncService: CasSyncService,
    private val sessionInfoRepository: SessionInfoRepository,
    private val operationLogService: OperationLogService
) {

    @GetMapping
    fun list(authentication: Authentication): ApiResponse<List<AccountDto>> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(accountService.listByUserId(userId))
    }

    @PostMapping
    fun create(
        @RequestBody request: AccountCreateRequest,
        authentication: Authentication
    ): ApiResponse<AccountDto> {
        val userId = authentication.name.toLong()
        val account = accountService.create(userId, request)
        operationLogService.log(
            userId = userId,
            action = "CREATE_ACCOUNT",
            targetType = "ACCOUNT",
            targetId = account.id,
            detail = "Created account: ${account.accountName}"
        )
        return ApiResponse.ok(account)
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long, authentication: Authentication): ApiResponse<AccountDto> {
        val userId = authentication.name.toLong()
        return ApiResponse.ok(accountService.getByIdAndUserId(id, userId))
    }

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: AccountUpdateRequest,
        authentication: Authentication
    ): ApiResponse<AccountDto> {
        val userId = authentication.name.toLong()
        accountService.getByIdAndUserId(id, userId)
        val account = accountService.update(id, request)
        operationLogService.log(
            userId = userId,
            action = "UPDATE_ACCOUNT",
            targetType = "ACCOUNT",
            targetId = id,
            detail = "Updated account"
        )
        return ApiResponse.ok(account)
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, authentication: Authentication): ApiResponse<Nothing> {
        val userId = authentication.name.toLong()
        accountService.getByIdAndUserId(id, userId)
        accountService.delete(id)
        operationLogService.log(
            userId = userId,
            action = "DELETE_ACCOUNT",
            targetType = "ACCOUNT",
            targetId = id,
            detail = "Deleted account"
        )
        return ApiResponse.ok(message = "Account deleted successfully")
    }

    @PostMapping("/{id}/login")
    fun triggerLogin(@PathVariable id: Long, authentication: Authentication): ApiResponse<Map<String, Boolean>> {
        val userId = authentication.name.toLong()
        accountService.getByIdAndUserId(id, userId)
        val success = casSyncService.loginAccount(id)
        operationLogService.log(
            userId = userId,
            action = "TRIGGER_LOGIN",
            targetType = "ACCOUNT",
            targetId = id,
            detail = "Manual login triggered, success=$success"
        )
        return ApiResponse.ok(mapOf("success" to success))
    }

    @PostMapping("/{id}/sync")
    fun triggerSync(@PathVariable id: Long, authentication: Authentication): ApiResponse<Map<String, Int>> {
        val userId = authentication.name.toLong()
        accountService.getByIdAndUserId(id, userId)
        val newCount = casSyncService.syncBills(id)
        operationLogService.log(
            userId = userId,
            action = "TRIGGER_SYNC",
            targetType = "ACCOUNT",
            targetId = id,
            detail = "Manual sync triggered, $newCount new bills"
        )
        return ApiResponse.ok(mapOf("newBills" to newCount))
    }

    @GetMapping("/{id}/session")
    fun getSession(@PathVariable id: Long, authentication: Authentication): ApiResponse<SessionDto?> {
        val userId = authentication.name.toLong()
        accountService.getByIdAndUserId(id, userId)
        val session = sessionInfoRepository.findByAccountId(id)
        val dto = session?.toDto()
        return ApiResponse.ok(dto)
    }

    private fun SessionInfo.toDto() = SessionDto(
        id = id,
        accountId = accountId,
        loginTime = loginTime,
        expireTime = expireTime,
        isValid = isValid,
        updatedAt = updatedAt
    )
}
