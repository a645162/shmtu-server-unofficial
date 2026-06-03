package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OperationLogDto
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.OperationLog
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.OperationLogRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class OperationLogService(
    private val operationLogRepository: OperationLogRepository
) {

    @Transactional
    fun log(
        userId: Long?,
        action: String,
        targetType: String?,
        targetId: Long?,
        detail: String?,
        ipAddress: String? = null
    ): OperationLog {
        val operationLog = OperationLog(
            userId = userId,
            action = action,
            targetType = targetType,
            targetId = targetId,
            detail = detail,
            ipAddress = ipAddress
        )
        return operationLogRepository.save(operationLog)
    }

    fun queryByUser(userId: Long, pageable: Pageable): Page<OperationLogDto> {
        return operationLogRepository.findByUserId(userId, pageable).map { it.toDto() }
    }

    fun queryAll(pageable: Pageable): Page<OperationLogDto> {
        return operationLogRepository.findAllByOrderByCreatedAtDesc(pageable).map { it.toDto() }
    }

    private fun OperationLog.toDto() = OperationLogDto(
        id = id,
        userId = userId,
        action = action,
        targetType = targetType,
        targetId = targetId,
        detail = detail,
        ipAddress = ipAddress,
        createdAt = createdAt.toString()
    )
}
