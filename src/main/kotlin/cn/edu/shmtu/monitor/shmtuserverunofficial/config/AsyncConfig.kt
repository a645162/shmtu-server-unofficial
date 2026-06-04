package cn.edu.shmtu.monitor.shmtuserverunofficial.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import java.util.concurrent.Executor

/**
 * 启用 @Async，使 [cn.edu.shmtu.monitor.shmtuserverunofficial.scheduler.OcrServerMonitor]
 * 能在每台 OCR 服务器的探活上并发执行，避免单台阻塞整轮轮询。
 */
@Configuration
@EnableAsync
class AsyncConfig {

    @Bean(name = ["ocrMonitorExecutor"])
    fun ocrMonitorExecutor(): Executor {
        val executor = ThreadPoolTaskExecutor()
        executor.corePoolSize = 4
        executor.maxPoolSize = 16
        executor.queueCapacity = 100
        executor.setThreadNamePrefix("ocr-monitor-")
        executor.setWaitForTasksToCompleteOnShutdown(true)
        executor.setAwaitTerminationSeconds(30)
        executor.initialize()
        return executor
    }
}
