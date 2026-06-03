package cn.edu.shmtu.monitor.shmtuserverunofficial.scheduler

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.SchedulerProperties
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.AccountRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.SessionInfoRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.CasSyncService
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.NotificationService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDateTime

@Component
class SessionCheckScheduler(
    private val sessionInfoRepository: SessionInfoRepository,
    private val accountRepository: AccountRepository,
    private val casSyncService: CasSyncService,
    private val notificationService: NotificationService,
    private val schedulerProperties: SchedulerProperties
) {
    private val logger = LoggerFactory.getLogger(SessionCheckScheduler::class.java)

    @Scheduled(cron = "\${scheduler.session-check.cron:0 0 * * * *}")
    fun checkSessions() {
        if (!schedulerProperties.sessionCheck.enabled) {
            logger.debug("Session check scheduler is disabled")
            return
        }

        logger.info("Starting scheduled session check")
        val thresholdMinutes = schedulerProperties.sessionExpireThreshold
        val now = LocalDateTime.now()
        val thresholdTime = now.plusMinutes(thresholdMinutes.toLong())

        val validSessions = sessionInfoRepository.findByIsValidTrue()
        var reLoginCount = 0
        var failCount = 0

        for (session in validSessions) {
            try {
                val expireTime = session.expireTime
                if (expireTime != null && expireTime.isBefore(thresholdTime)) {
                    val account = accountRepository.findById(session.accountId).orElse(null)
                    if (account == null || !account.enable) {
                        session.isValid = false
                        sessionInfoRepository.save(session)
                        continue
                    }

                    val success = casSyncService.loginAccount(session.accountId)
                    if (success) {
                        reLoginCount++
                        logger.info("Re-login succeeded for account ${account.accountId}")
                    } else {
                        failCount++
                        logger.warn("Re-login failed for account ${account.accountId}")

                        notificationService.sendNotification(
                            userId = account.userId,
                            type = "SESSION_EXPIRED",
                            title = "Session Re-login Failed",
                            content = "Account ${account.accountName} (${account.accountId}) " +
                                "session expired and re-login failed. Please check your credentials."
                        )
                    }
                }
            } catch (e: Exception) {
                failCount++
                logger.error("Error checking session for account ${session.accountId}", e)
            }
        }

        logger.info(
            "Session check completed: ${validSessions.size} checked, $reLoginCount re-logged in, $failCount failed"
        )
    }
}
