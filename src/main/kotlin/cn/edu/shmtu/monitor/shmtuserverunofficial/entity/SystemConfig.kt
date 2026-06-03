package cn.edu.shmtu.monitor.shmtuserverunofficial.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "system_config", uniqueConstraints = [UniqueConstraint(name = "idx_system_config_key", columnNames = ["config_key"])])
class SystemConfig(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long = 0,

    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    var configKey: String = "",

    @Column(name = "config_value", columnDefinition = "TEXT")
    var configValue: String? = null,

    @Column(name = "description", length = 500)
    var description: String? = null,

    @Column(name = "value_type", length = 20)
    var valueType: String = "STRING",

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
