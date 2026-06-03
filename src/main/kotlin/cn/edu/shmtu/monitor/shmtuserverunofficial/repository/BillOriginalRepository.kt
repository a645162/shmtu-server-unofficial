package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.BillOriginal
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface BillOriginalRepository : JpaRepository<BillOriginal, Long> {
    fun findByAccountId(accountId: Long): List<BillOriginal>
    fun findByAccountIdAndBillDateBetween(accountId: Long, startDate: LocalDate, endDate: LocalDate): List<BillOriginal>
    fun findByAccountIdAndIsNewTrue(accountId: Long): List<BillOriginal>
    fun existsByTransactionNo(transactionNo: String): Boolean
    fun countByAccountIdAndIsNewTrue(accountId: Long): Long

    @Query("SELECT b FROM BillOriginal b WHERE b.accountId IN :accountIds ORDER BY b.billDate DESC, b.billTime DESC")
    fun findByAccountIdInOrderByBillDateDescBillTimeDesc(accountIds: List<Long>): List<BillOriginal>

    @Query("SELECT b FROM BillOriginal b WHERE b.accountId IN :accountIds AND b.billDate BETWEEN :startDate AND :endDate ORDER BY b.billDate DESC, b.billTime DESC")
    fun findByAccountIdInAndBillDateBetween(accountIds: List<Long>, startDate: LocalDate, endDate: LocalDate): List<BillOriginal>

    @Query("SELECT b FROM BillOriginal b WHERE b.accountId IN :accountIds AND b.isNew = true ORDER BY b.billDate DESC, b.billTime DESC")
    fun findByAccountIdInAndIsNewTrue(accountIds: List<Long>): List<BillOriginal>

    @Query("SELECT COUNT(b) FROM BillOriginal b WHERE b.accountId IN :accountIds AND b.isNew = true")
    fun countByAccountIdInAndIsNewTrue(accountIds: List<Long>): Long
}
