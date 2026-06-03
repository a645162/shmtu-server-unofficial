package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.SessionInfo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SessionInfoRepository : JpaRepository<SessionInfo, Long> {
    fun findByAccountId(accountId: Long): SessionInfo?
    fun findByIsValidTrue(): List<SessionInfo>
}
