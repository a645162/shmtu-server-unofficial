package cn.edu.shmtu.monitor.shmtuserverunofficial.repository

import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.SystemConfig
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SystemConfigRepository : JpaRepository<SystemConfig, Long> {
    fun findByConfigKey(key: String): SystemConfig?
    override fun findAll(): List<SystemConfig>
}
