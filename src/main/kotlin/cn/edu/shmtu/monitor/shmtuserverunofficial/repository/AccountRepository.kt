package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.Account
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AccountRepository : JpaRepository<Account, Long> {
    fun findByUserId(userId: Long): List<Account>
    fun findByIdAndUserId(id: Long, userId: Long): Account?
    fun findByAccountId(accountId: String): Account?
    fun findByEnableTrue(): List<Account>
    fun findByEnableUpdateTrueAndEnableTrue(): List<Account>
}
