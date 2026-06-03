package cn.edu.shmtu.monitor.shmtuserverunofficial.scheduler

import cn.edu.shmtu.monitor.shmtuserverunofficial.config.SchedulerProperties
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.AccountRepository
import cn.edu.shmtu.monitor.shmtuserverunofficial.service.CasSyncService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class BillSyncScheduler(
    private val casSyncService: CasSyncService,
    private val accountRepository: AccountRepository,
    private val schedulerProperties: SchedulerProperties
) {
    private val logger = LoggerFactory.getLogger(BillSyncScheduler::class.java)

    @Scheduled(cron = "\${scheduler.bill-sync.cron:0 0 */2 * * *}")
    fun syncBills() {
        if (!schedulerProperties.billSync.enabled) {
            logger.debug("Bill sync scheduler is disabled")
            return
        }

        logger.info("Starting scheduled bill sync")
        val accounts = accountRepository.findByEnableUpdateTrueAndEnableTrue()

        if (accounts.isEmpty()) {
            logger.info("No accounts to sync")
            return
        }

        var totalNew = 0
        var successCount = 0
        var failCount = 0

        for ((index, account) in accounts.withIndex()) {
            try {
                if (index > 0) {
                    val delayMs = (Math.random() * 30000).toLong()
                    Thread.sleep(delayMs)
                }

                val newCount = casSyncService.syncBills(account.id)
                totalNew += newCount
                successCount++
                logger.info("Synced account ${account.accountId}: $newCount new bills")
            } catch (e: Exception) {
                failCount++
                logger.error("Failed to sync account ${account.accountId}", e)
            }
        }

        logger.info(
            "Bill sync completed: $successCount succeeded, $failCount failed, $totalNew total new bills"
        )
    }
}
