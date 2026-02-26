package com.cafe.erp.gaming.application;

import com.cafe.erp.gaming.application.command.StartSessionRequest;
import com.cafe.erp.gaming.application.command.SwitchTypeRequest;
import com.cafe.erp.gaming.domain.model.*;
import com.cafe.erp.gaming.infrastructure.persistence.DeviceRepository;
import com.cafe.erp.gaming.infrastructure.persistence.GamingSessionRepository;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.pos.application.command.CreateOrderRequest;
import com.cafe.erp.pos.application.service.OrderService;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class GamingService {
    private final GamingSessionRepository sessionRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public GamingSession startSession(StartSessionRequest req) {
        Device device = deviceRepository.findById(req.getDeviceId())
                .orElseThrow(() -> BusinessException.notFound("Device"));
        if (device.getStatus() == DeviceStatus.ACTIVE) throw BusinessException.conflict("Device already has an active session");

        User user = SecurityUtils.currentUser();

        // Create linked order
        var orderReq = new CreateOrderRequest();
        orderReq.setSource(com.cafe.erp.pos.domain.model.OrderSource.GAMING);
        orderReq.setDeviceId(device.getId());
        orderReq.setDeviceName(device.getName());
        orderReq.setCustomerId(req.getCustomerId());
        var order = orderService.createOrder(orderReq);

        LocalDateTime now = LocalDateTime.now();
        GamingSession session = GamingSession.builder()
                .deviceId(device.getId()).deviceName(device.getName())
                .cashierId(user.getId()).startedAt(now)
                .currentType(req.getSessionType()).linkedOrderId(order.getId())
                .customerId(req.getCustomerId()).build();
        GamingSession saved = sessionRepository.save(session);

        // First segment
        SessionSegment segment = SessionSegment.builder()
                .sessionId(saved.getId()).sessionType(req.getSessionType())
                .rate(req.getSessionType() == SessionType.SINGLE ? device.getSingleRate() : device.getMultiRate())
                .startedAt(now).build();
        saved.getSegments().add(segment);
        sessionRepository.save(saved);

        device.setStatus(DeviceStatus.ACTIVE);
        deviceRepository.save(device);
        broadcastDeviceUpdate(device);
        return saved;
    }

    @Transactional
    public GamingSession switchType(UUID sessionId, SwitchTypeRequest req) {
        GamingSession session = getActiveSession(sessionId);
        if (session.getCurrentType() == req.getNewType()) throw new BusinessException("Session is already " + req.getNewType());

        Device device = deviceRepository.findById(session.getDeviceId()).orElseThrow();
        LocalDateTime now = LocalDateTime.now();

        // Close current segment
        SessionSegment current = session.getSegments().stream()
                .filter(s -> s.getEndedAt() == null).findFirst().orElseThrow();
        closeSegment(current, now);

        // Open new segment
        SessionSegment next = SessionSegment.builder()
                .sessionId(sessionId).sessionType(req.getNewType())
                .rate(req.getNewType() == SessionType.SINGLE ? device.getSingleRate() : device.getMultiRate())
                .startedAt(now).build();
        session.getSegments().add(next);
        session.setCurrentType(req.getNewType());
        return sessionRepository.save(session);
    }

    @Transactional
    public GamingSession endSession(UUID sessionId) {
        GamingSession session = getActiveSession(sessionId);
        Device device = deviceRepository.findById(session.getDeviceId()).orElseThrow();
        LocalDateTime now = LocalDateTime.now();

        // Close last segment
        session.getSegments().stream().filter(s -> s.getEndedAt() == null).forEach(s -> closeSegment(s, now));

        // Calculate total
        BigDecimal total = session.getSegments().stream()
                .map(s -> s.getAmount() != null ? s.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        session.setGamingAmount(total);
        session.setTotalMinutes((int) Duration.between(session.getStartedAt(), now).toMinutes());
        session.setEndedAt(now);
        session.setStatus(SessionStatus.CLOSED);

        device.setStatus(DeviceStatus.FREE);
        deviceRepository.save(device);
        broadcastDeviceUpdate(device);

        log.info("Session ended for {}. Duration: {} min, Amount: {} EGP",
                session.getDeviceName(), session.getTotalMinutes(), total);
        return sessionRepository.save(session);
    }

    private void closeSegment(SessionSegment segment, LocalDateTime endTime) {
        segment.setEndedAt(endTime);
        int minutes = (int) Math.max(15, Duration.between(segment.getStartedAt(), endTime).toMinutes());
        segment.setDurationMinutes(minutes);
        segment.setAmount(segment.getRate().multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
    }

    public List<GamingSession> getActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE);
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findByActiveAndDeletedFalseOrderByName(true);
    }

    private GamingSession getActiveSession(UUID id) {
        GamingSession s = sessionRepository.findById(id).orElseThrow(() -> BusinessException.notFound("Session"));
        if (s.getStatus() != SessionStatus.ACTIVE) throw new BusinessException("Session is not active");
        return s;
    }

    private void broadcastDeviceUpdate(Device device) {
        messagingTemplate.convertAndSend("/topic/devices", device);
    }
}
