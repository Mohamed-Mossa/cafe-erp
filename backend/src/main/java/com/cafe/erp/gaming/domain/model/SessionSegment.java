package com.cafe.erp.gaming.domain.model;
import com.cafe.erp.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "session_segments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionSegment extends BaseEntity {
    @Column(nullable = false) private UUID sessionId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private SessionType sessionType;
    @Column(nullable = false, precision = 8, scale = 2) private BigDecimal rate;
    @Column(nullable = false) private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationMinutes;
    @Column(precision = 10, scale = 2) private BigDecimal amount;
}
