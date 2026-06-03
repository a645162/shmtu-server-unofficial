package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.BillOriginal
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.AccountRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.BillOriginalRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Service
class BillService(
    private val billOriginalRepository: BillOriginalRepository,
    private val accountRepository: AccountRepository
) {

    fun queryBills(userId: Long, request: BillQueryRequest): List<BillDto> {
        val accountIds = resolveAccountIds(userId, request.accountIds)
        if (accountIds.isEmpty()) return emptyList()

        val bills = if (request.startDate != null && request.endDate != null) {
            billOriginalRepository.findByAccountIdInAndBillDateBetween(
                accountIds, request.startDate, request.endDate
            )
        } else if (request.isNew == true) {
            billOriginalRepository.findByAccountIdInAndIsNewTrue(accountIds)
        } else {
            billOriginalRepository.findByAccountIdInOrderByBillDateDescBillTimeDesc(accountIds)
        }

        return bills.map { it.toDto() }
    }

    fun getNewBillsCount(userId: Long): Long {
        val accountIds = getUserAccountIds(userId)
        if (accountIds.isEmpty()) return 0
        return billOriginalRepository.countByAccountIdInAndIsNewTrue(accountIds)
    }

    fun getNewBills(userId: Long): List<BillDto> {
        val accountIds = getUserAccountIds(userId)
        if (accountIds.isEmpty()) return emptyList()
        return billOriginalRepository.findByAccountIdInAndIsNewTrue(accountIds).map { it.toDto() }
    }

    fun getBillStats(userId: Long, accountIds: List<Long>? = null): BillStatsDto {
        val resolvedAccountIds = resolveAccountIds(userId, accountIds)
        if (resolvedAccountIds.isEmpty()) {
            return BillStatsDto(
                totalCount = 0,
                totalAmount = BigDecimal.ZERO,
                newCount = 0,
                categoryStats = emptyMap()
            )
        }

        val allBills = billOriginalRepository.findByAccountIdInOrderByBillDateDescBillTimeDesc(resolvedAccountIds)
        val newCount = billOriginalRepository.countByAccountIdInAndIsNewTrue(resolvedAccountIds)

        val totalAmount = allBills.filter { it.money != null }
            .fold(BigDecimal.ZERO) { acc, bill -> acc.add(bill.money!!) }

        val categoryStats = allBills.groupBy { it.category ?: "OTHER" }
            .mapValues { entry ->
                CategoryStat(
                    count = entry.value.size.toLong(),
                    totalAmount = entry.value.filter { it.money != null }
                        .fold(BigDecimal.ZERO) { acc, bill -> acc.add(bill.money!!) }
                )
            }

        return BillStatsDto(
            totalCount = allBills.size.toLong(),
            totalAmount = totalAmount,
            newCount = newCount,
            categoryStats = categoryStats
        )
    }

    @Transactional
    fun markAsRead(userId: Long, request: BillMarkReadRequest) {
        if (request.markAll) {
            val accountIds = getUserAccountIds(userId)
            if (accountIds.isEmpty()) return
            val newBills = billOriginalRepository.findByAccountIdInAndIsNewTrue(accountIds)
            newBills.forEach { it.isNew = false }
            billOriginalRepository.saveAll(newBills)
        } else if (!request.billIds.isNullOrEmpty()) {
            val bills = billOriginalRepository.findAllById(request.billIds)
            bills.forEach { it.isNew = false }
            billOriginalRepository.saveAll(bills)
        }
    }

    @Transactional
    fun saveBill(bill: BillOriginal): BillOriginal {
        if (billOriginalRepository.existsByTransactionNo(bill.transactionNo)) {
            return bill
        }
        return billOriginalRepository.save(bill)
    }

    private fun getUserAccountIds(userId: Long): List<Long> {
        return accountRepository.findByUserId(userId).map { it.id }
    }

    private fun resolveAccountIds(userId: Long, requestedAccountIds: List<Long>?): List<Long> {
        if (requestedAccountIds != null) {
            val userAccountIds = getUserAccountIds(userId).toSet()
            return requestedAccountIds.filter { it in userAccountIds }
        }
        return getUserAccountIds(userId)
    }

    private fun BillOriginal.toDto() = BillDto(
        id = id,
        accountId = accountId,
        transactionNo = transactionNo,
        billDate = billDate,
        billTime = billTime,
        billType = billType,
        targetUser = targetUser,
        amount = amount,
        money = money,
        paymentMethod = paymentMethod,
        status = status,
        category = category,
        position = position,
        room = room,
        isNew = isNew
    )
}
