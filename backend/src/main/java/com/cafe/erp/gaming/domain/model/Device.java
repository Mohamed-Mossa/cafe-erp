package com.cafe.erp.gaming.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name = "devices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device extends BaseEntity {
    @Column(nullable = false, length = 50) private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private DeviceType type;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal singleRate;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal multiRate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) @Builder.Default private DeviceStatus status = DeviceStatus.FREE;
    private int positionX;
    private int positionY;
    @Builder.Default private boolean active = true;
}
