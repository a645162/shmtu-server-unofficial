package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.NotificationLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NotificationLogRepository : JpaRepository<NotificationLog, Long> {
    fun findByUserId(userId: Long): List<NotificationLog>
    fun findByUserIdOrderByCreatedAtDesc(userId: Long): List<NotificationLog>
    fun findByStatus(status: String): List<NotificationLog>
    fun findByStatusAndRetryCountLessThan(status: String, maxRetry: Int): List<NotificationLog>
}
