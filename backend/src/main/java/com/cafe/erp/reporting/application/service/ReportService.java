package com.cafe.erp.reporting.application.service;

import com.cafe.erp.pos.infrastructure.persistence.OrderRepository;
import com.cafe.erp.gaming.infrastructure.persistence.GamingSessionRepository;
import com.cafe.erp.shift.infrastructure.persistence.ShiftRepository;
import com.cafe.erp.inventory.infrastructure.persistence.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class ReportService {
    private final OrderRepository orderRepository;
    private final GamingSessionRepository gamingSessionRepository;
    private final ShiftRepository shiftRepository;
    private final InventoryItemRepository inventoryRepository;

    public Map<String, Object> getDashboard() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime now = LocalDateTime.now();

        var todayOrders = orderRepository.findByClosedAtBetweenAndDeletedFalse(startOfDay, now);

        BigDecimal todaySales = todayOrders.stream()
                .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long openOrders = orderRepository.findByStatusAndDeletedFalse(
                com.cafe.erp.pos.domain.model.OrderStatus.OPEN).size();

        long activeSessions = gamingSessionRepository.findByStatus(
                com.cafe.erp.gaming.domain.model.SessionStatus.ACTIVE).size();

        long lowStockAlerts = inventoryRepository.findLowStockItems().size();

        return Map.of(
                "todaySales", todaySales,
                "todayOrderCount", todayOrders.size(),
                "openOrders", openOrders,
                "activeSessions", activeSessions,
                "lowStockAlerts", lowStockAlerts,
                "generatedAt", now.toString()
        );
    }

    public Map<String, Object> getSalesReport(LocalDateTime from, LocalDateTime to) {
        var orders = orderRepository.findByClosedAtBetweenAndDeletedFalse(from, to);

        BigDecimal totalRevenue = orders.stream()
                .map(o -> o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = orders.stream()
                .map(o -> o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Sales breakdown by source
        Map<String, Long> bySource = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueBySource = new LinkedHashMap<>();
        orders.forEach(o -> {
            String src = o.getSource().name();
            bySource.merge(src, 1L, Long::sum);
            revenueBySource.merge(src, o.getGrandTotal() != null ? o.getGrandTotal() : BigDecimal.ZERO, BigDecimal::add);
        });

        return Map.of(
                "from", from.toString(), "to", to.toString(),
                "orderCount", orders.size(),
                "totalRevenue", totalRevenue,
                "totalDiscount", totalDiscount,
                "ordersBySource", bySource,
                "revenueBySource", revenueBySource
        );
    }
}
