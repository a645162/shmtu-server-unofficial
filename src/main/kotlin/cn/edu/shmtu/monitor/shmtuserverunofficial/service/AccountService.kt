package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.Account
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.AccountRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.UserRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.util.AesEncryptUtil
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class AccountService(
    private val accountRepository: AccountRepository,
    private val userRepository: UserRepository,
    private val aesEncryptUtil: AesEncryptUtil
) {

    fun listByUserId(userId: Long): List<AccountDto> {
        return accountRepository.findByUserId(userId).map { it.toDto() }
    }

    fun getById(id: Long): AccountDto {
        val account = accountRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Account not found") }
        return account.toDto()
    }

    fun getByIdAndUserId(id: Long, userId: Long): AccountDto {
        val account = accountRepository.findByIdAndUserId(id, userId)
            ?: throw IllegalArgumentException("Account not found")
        return account.toDto()
    }

    @Transactional
    fun create(userId: Long, request: AccountCreateRequest): AccountDto {
        userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found") }

        if (accountRepository.findByAccountId(request.accountId) != null) {
            throw IllegalArgumentException("Account ID already exists")
        }

        val account = Account(
            userId = userId,
            accountName = request.accountName,
            accountId = request.accountId,
            passwordEncrypted = aesEncryptUtil.encrypt(request.password),
            enable = request.enable,
            enableUpdate = request.enableUpdate,
            admissionDate = request.admissionDate,
            graduationDate = request.graduationDate,
            expireDate = request.expireDate
        )
        return accountRepository.save(account).toDto()
    }

    @Transactional
    fun update(id: Long, request: AccountUpdateRequest): AccountDto {
        val account = accountRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Account not found") }

        request.accountName?.let { account.accountName = it }
        request.password?.let { account.passwordEncrypted = aesEncryptUtil.encrypt(it) }
        request.enable?.let { account.enable = it }
        request.enableUpdate?.let { account.enableUpdate = it }
        request.admissionDate?.let { account.admissionDate = it }
        request.graduationDate?.let { account.graduationDate = it }
        request.expireDate?.let { account.expireDate = it }
        account.updatedAt = LocalDateTime.now()

        return accountRepository.save(account).toDto()
    }

    @Transactional
    fun delete(id: Long) {
        val account = accountRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Account not found") }
        accountRepository.delete(account)
    }

    fun getDecryptedPassword(accountId: Long): String {
        val account = accountRepository.findById(accountId)
            .orElseThrow { IllegalArgumentException("Account not found") }
        return aesEncryptUtil.decrypt(account.passwordEncrypted)
    }

    private fun Account.toDto() = AccountDto(
        id = id,
        userId = userId,
        accountName = accountName,
        accountId = accountId,
        enable = enable,
        enableUpdate = enableUpdate,
        admissionDate = admissionDate,
        graduationDate = graduationDate,
        expireDate = expireDate,
        lastLoginTime = lastLoginTime,
        lastLoginStatus = lastLoginStatus,
        lastBillSyncTime = lastBillSyncTime,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
