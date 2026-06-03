package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.OperationLog
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface OperationLogRepository : JpaRepository<OperationLog, Long> {
    fun findByUserId(userId: Long, pageable: Pageable): Page<OperationLog>
    fun findAllByOrderByCreatedAtDesc(pageable: Pageable): Page<OperationLog>
}
