package cn.edu.shmtu.monitor.shmtuserverunofficial.service

import cn.edu.shmtu.monitor.shmtuserverunofficial.dto.OcrRecognizeRequest
import cn.edu.shmtu.monitor.shmtuserverunofficial.entity.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.repository.*
import cn.edu.shmtu.monitor.shmtuserverunofficial.util.AesEncryptUtil
import cn.edu.shmtu.cas.auth.EpayAuth
import cn.edu.shmtu.cas.captcha.CaptchaAnswer
import cn.edu.shmtu.cas.captcha.CaptchaResolver
import cn.edu.shmtu.cas.datatype.BillType
import cn.edu.shmtu.cas.session.LoginSubmitResult
import cn.edu.shmtu.cas.session.SessionProbe
import cn.edu.shmtu.cas.sync.BillStore
import cn.edu.shmtu.cas.sync.incrementalSync
import cn.edu.shmtu.cas.sync.SyncOptions
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
class CasSyncService(
    private val accountRepository: AccountRepository,
    private val sessionInfoRepository: SessionInfoRepository,
    private val billOriginalRepository: BillOriginalRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService,
    private val ocrService: OcrService,
    private val aesEncryptUtil: AesEncryptUtil
) {
    private val logger = LoggerFactory.getLogger(CasSyncService::class.java)

    @Transactional
    fun loginAccount(accountId: Long): Boolean {
        val account = accountRepository.findById(accountId)
            .orElseThrow { IllegalArgumentException("Account not found") }

        val password = aesEncryptUtil.decrypt(account.passwordEncrypted)

        return try {
            val captchaResolver = createOcrCaptchaResolver()
            val epayAuth = EpayAuth(captchaResolver)

            runBlocking {
                // Probe login status first
                val probeResult = epayAuth.probeLogin()
                if (probeResult.isFailure) {
                    account.lastLoginStatus = "FAILED"
                    accountRepository.save(account)
                    logger.warn("Account ${account.accountId} probe failed: ${probeResult.exceptionOrNull()?.message}")
                    return@runBlocking false
                }

                val probe = probeResult.getOrThrow()
                if (probe is SessionProbe.AlreadyLoggedIn) {
                    saveSession(accountId, epayAuth.extractSession())
                    account.lastLoginTime = LocalDateTime.now()
                    account.lastLoginStatus = "SUCCESS"
                    accountRepository.save(account)
                    logger.info("Account ${account.accountId} already logged in (TGC reuse)")
                    return@runBlocking true
                }

                // Try auto login with captcha resolver
                val loginResult = epayAuth.submitLogin(account.accountId, password)
                if (loginResult.isFailure) {
                    account.lastLoginStatus = "FAILED"
                    accountRepository.save(account)
                    logger.warn("Account ${account.accountId} login failed: ${loginResult.exceptionOrNull()?.message}")
                    return@runBlocking false
                }

                when (val result = loginResult.getOrThrow()) {
                    is LoginSubmitResult.Success -> {
                        saveSession(accountId, epayAuth.extractSession())
                        account.lastLoginTime = LocalDateTime.now()
                        account.lastLoginStatus = "SUCCESS"
                        accountRepository.save(account)
                        logger.info("Account ${account.accountId} login success")
                        true
                    }
                    is LoginSubmitResult.PasswordError -> {
                        account.lastLoginStatus = "PASSWORD_ERROR"
                        accountRepository.save(account)
                        notificationService.sendNotification(
                            userId = account.userId,
                            type = "LOGIN_FAIL",
                            title = "CAS Login Failed",
                            content = "Account ${account.accountName} (${account.accountId}) password error"
                        )
                        false
                    }
                    is LoginSubmitResult.ValidateCodeError -> {
                        account.lastLoginStatus = "CAPTCHA_ERROR"
                        accountRepository.save(account)
                        logger.warn("Account ${account.accountId} login failed: captcha error")
                        false
                    }
                    is LoginSubmitResult.Failure -> {
                        account.lastLoginStatus = "FAILED"
                        accountRepository.save(account)
                        notificationService.sendNotification(
                            userId = account.userId,
                            type = "LOGIN_FAIL",
                            title = "CAS Login Failed",
                            content = "Account ${account.accountName} (${account.accountId}) login failed: ${result.message}"
                        )
                        false
                    }
                }
            }
        } catch (e: Exception) {
            account.lastLoginStatus = "ERROR"
            accountRepository.save(account)
            logger.error("Account ${account.accountId} login error", e)
            false
        }
    }

    @Transactional
    fun syncBills(accountId: Long): Int {
        val account = accountRepository.findById(accountId)
            .orElseThrow { IllegalArgumentException("Account not found") }

        val session = sessionInfoRepository.findByAccountId(accountId)
        if (session == null || !session.isValid) {
            val loginSuccess = loginAccount(accountId)
            if (!loginSuccess) {
                return 0
            }
        }

        val currentSession = sessionInfoRepository.findByAccountId(accountId)!!

        return try {
            val captchaResolver = createOcrCaptchaResolver()
            val epayAuth = EpayAuth(captchaResolver)

            // Restore session cookies
            if (!currentSession.cookies.isNullOrBlank()) {
                epayAuth.restoreSession(currentSession.cookies!!)
            }

            runBlocking {
                // Test login status
                val testResult = epayAuth.testLoginStatus()
                if (testResult.isFailure || testResult.getOrThrow() == false) {
                    // Session expired, re-login needed - exit runBlocking for non-suspend loginAccount
                    return@runBlocking -1 // Signal re-login needed
                }

                // Sync bills using incrementalSync
                val billStore = object : BillStore {
                    override fun contains(transactionNo: String): Boolean {
                        return billOriginalRepository.existsByTransactionNo(
                            buildTransactionNo(account.accountId, transactionNo)
                        )
                    }

                    override fun merge(newBills: List<cn.edu.shmtu.cas.datatype.BillItem>) {
                        for (billItem in newBills) {
                            val txnNo = buildTransactionNo(account.accountId, billItem.transactionNo)
                            if (!billOriginalRepository.existsByTransactionNo(txnNo)) {
                                val billOriginal = BillOriginal(
                                    accountId = accountId,
                                    transactionNo = txnNo,
                                    billDate = try { LocalDate.parse(billItem.dateStr.replace(".", "-")) } catch (_: Exception) { null },
                                    billTime = try { LocalTime.parse(billItem.timeStrFormat) } catch (_: Exception) { null },
                                    billType = billItem.billType,
                                    targetUser = billItem.targetUser,
                                    amount = try { BigDecimal(billItem.amount.replace("[^\\d.]".toRegex(), "")) } catch (_: Exception) { null },
                                    money = try { BigDecimal(String.format("%.2f", billItem.money)) } catch (_: Exception) { null },
                                    paymentMethod = billItem.paymentMethod,
                                    status = billItem.status.name,
                                    category = try { cn.edu.shmtu.cas.classifier.BillCategory.fromString(billItem.billType).name } catch (_: Exception) { null },
                                    isNew = true
                                )
                                billOriginalRepository.save(billOriginal)
                            }
                        }
                    }
                }

                val syncResult = incrementalSync(
                    auth = epayAuth,
                    store = billStore,
                    options = SyncOptions(billType = BillType.ALL)
                )

                if (syncResult.isFailure) {
                    logger.error("Account ${account.accountId} bill sync failed: ${syncResult.exceptionOrNull()?.message}")
                    return@runBlocking 0
                }

                val result = syncResult.getOrThrow()

                // Update session cookies
                currentSession.cookies = epayAuth.extractSession()
                currentSession.updatedAt = LocalDateTime.now()
                sessionInfoRepository.save(currentSession)

                account.lastBillSyncTime = LocalDateTime.now()
                accountRepository.save(account)

                if (result.newCount > 0) {
                    notificationService.sendNotification(
                        userId = account.userId,
                        type = "NEW_BILL",
                        title = "New Bills Detected",
                        content = "Account ${account.accountName} has ${result.newCount} new bill(s)"
                    )
                }

                logger.info("Account ${account.accountId} sync completed: ${result.newCount} new bills")
                result.newCount
            }
        } catch (e: Exception) {
            logger.error("Account ${account.accountId} bill sync error", e)

            notificationService.sendNotification(
                userId = account.userId,
                type = "SYNC_ERROR",
                title = "Bill Sync Error",
                content = "Account ${account.accountName} sync failed: ${e.message}"
            )

            0
        }.let { result ->
            // Handle re-login signal
            if (result == -1) {
                val loginSuccess = loginAccount(accountId)
                if (!loginSuccess) return 0
                // Retry sync after re-login (simplified: just return 0, next scheduled run will pick up)
                0
            } else {
                result
            }
        }
    }

    @Transactional
    fun syncUser(userId: Long): Int {
        val accounts = accountRepository.findByUserId(userId)
        var totalNew = 0
        for (account in accounts) {
            if (!account.enable || !account.enableUpdate) continue
            totalNew += syncBills(account.id)
        }
        return totalNew
    }

    @Transactional
    fun syncAll(): Int {
        val accounts = accountRepository.findByEnableUpdateTrueAndEnableTrue()
        var totalNew = 0
        for (account in accounts) {
            totalNew += syncBills(account.id)
        }
        return totalNew
    }

    private fun saveSession(accountId: Long, cookies: String) {
        val existingSession = sessionInfoRepository.findByAccountId(accountId)
        val session = existingSession ?: SessionInfo(accountId = accountId)

        session.cookies = cookies
        session.loginTime = LocalDateTime.now()
        session.expireTime = LocalDateTime.now().plusHours(2)
        session.isValid = true
        sessionInfoRepository.save(session)
    }

    private fun createOcrCaptchaResolver(): CaptchaResolver {
        return object : CaptchaResolver {
            override suspend fun resolve(imageData: ByteArray): Result<CaptchaAnswer> {
                val imageBase64 = java.util.Base64.getEncoder().encodeToString(imageData)
                val result = ocrService.recognize(OcrRecognizeRequest(imageBase64 = imageBase64))
                return if (result.success && result.result != null) {
                    Result.success(CaptchaAnswer(value = result.result))
                } else {
                    Result.failure(RuntimeException("OCR recognition failed: ${result.error}"))
                }
            }
        }
    }

    private fun buildTransactionNo(accountId: String, transactionNo: String): String {
        return "${accountId}_$transactionNo"
    }
}
