package com.cafe.erp.pos.application.service;

import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.menu.infrastructure.persistence.ProductRepository;
import com.cafe.erp.pos.application.command.*;
import com.cafe.erp.pos.domain.model.*;
import com.cafe.erp.pos.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderLineRepository orderLineRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Order createOrder(CreateOrderRequest req) {
        User user = SecurityUtils.currentUser();

        // Check no open order on the same table/device
        if (req.getTableId() != null) {
            List<Order> existing = orderRepository
                    .findByTableIdAndStatusAndDeletedFalse(req.getTableId(), OrderStatus.OPEN);
            if (!existing.isEmpty()) {
                throw BusinessException.conflict("Table already has an open order");
            }
        }

        Long nextNumber = orderRepository.findMaxOrderNumber();
        nextNumber = (nextNumber == null ? 0L : nextNumber) + 1;

        Order order = Order.builder()
                .orderNumber(nextNumber)
                .source(req.getSource())
                .tableId(req.getTableId())
                .tableName(req.getTableName())
                .deviceId(req.getDeviceId())
                .deviceName(req.getDeviceName())
                .cashierId(user.getId())
                .cashierName(user.getFullName())
                .customerId(req.getCustomerId())
                .status(OrderStatus.OPEN)
                .build();

        Order saved = orderRepository.save(order);
        broadcastOrderUpdate(saved);
        return saved;
    }

    @Transactional
    public Order addLine(UUID orderId, AddLineRequest req) {
        Order order = getOpenOrder(orderId);

        var product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> BusinessException.notFound("Product"));

        if (!product.isActive()) {
            throw new BusinessException("Product is not available");
        }

        OrderLine line = OrderLine.builder()
                .orderId(orderId)
                .productId(product.getId())
                .productName(product.getName())
                .quantity(req.getQuantity())
                .unitPrice(product.getSellingPrice())
                .totalPrice(product.getSellingPrice().multiply(BigDecimal.valueOf(req.getQuantity())))
                .notes(req.getNotes())
                .build();

        orderLineRepository.save(line);
        order.getLines().add(line);
        order.recalculateTotals();

        Order updated = orderRepository.save(order);
        broadcastOrderUpdate(updated);
        return updated;
    }

    @Transactional
    public Order removeLine(UUID orderId, UUID lineId) {
        Order order = getOpenOrder(orderId);

        OrderLine line = orderLineRepository.findById(lineId)
                .orElseThrow(() -> BusinessException.notFound("Order line"));

        if (!line.getOrderId().equals(orderId)) {
            throw new BusinessException("Line does not belong to this order");
        }

        orderLineRepository.delete(line);
        order.getLines().removeIf(l -> l.getId().equals(lineId));
        order.recalculateTotals();

        Order updated = orderRepository.save(order);
        broadcastOrderUpdate(updated);
        return updated;
    }

    @Transactional
    public Order applyManualDiscount(UUID orderId, ApplyDiscountRequest req, int userMaxDiscount) {
        Order order = getOpenOrder(orderId);

        if (req.getDiscountPercent().compareTo(BigDecimal.valueOf(userMaxDiscount)) > 0) {
            throw new BusinessException(
                    "Your role allows maximum " + userMaxDiscount + "% discount",
                    HttpStatus.FORBIDDEN
            );
        }

        BigDecimal discount = order.getSubtotal()
                .multiply(req.getDiscountPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        order.setDiscountAmount(discount);
        order.setDiscountType("MANUAL");
        order.recalculateTotals();

        return orderRepository.save(order);
    }

    @Transactional
    public Order processPayment(UUID orderId, ProcessPaymentRequest req) {
        Order order = getOpenOrder(orderId);

        BigDecimal totalPaid = req.getPayments().stream()
                .map(ProcessPaymentRequest.PaymentEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPaid.compareTo(order.getGrandTotal()) < 0) {
            throw new BusinessException("Payment amount is less than the grand total");
        }

        // Create payment records
        req.getPayments().forEach(entry -> {
            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .method(entry.getMethod())
                    .amount(entry.getAmount())
                    .reference(entry.getReference())
                    .build();
            order.getPayments().add(payment);
        });

        // Close the order
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());

        Order closed = orderRepository.save(order);

        // Broadcast update
        broadcastOrderUpdate(closed);

        // TODO: Deduct inventory, award loyalty points (via domain events)
        log.info("Order #{} closed. Total: {} EGP", closed.getOrderNumber(), closed.getGrandTotal());

        return closed;
    }

    @Transactional
    public void cancelOrder(UUID orderId, String reason) {
        Order order = getOpenOrder(orderId);
        order.setStatus(OrderStatus.CANCELLED);
        order.setClosedAt(LocalDateTime.now());
        orderRepository.save(order);
        broadcastOrderUpdate(order);
        log.info("Order #{} cancelled. Reason: {}", order.getOrderNumber(), reason);
    }

    public List<Order> getOpenOrders() {
        return orderRepository.findByStatusAndDeletedFalse(OrderStatus.OPEN);
    }

    public Order getOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> BusinessException.notFound("Order"));
    }

    private Order getOpenOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> BusinessException.notFound("Order"));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Order is not open. Status: " + order.getStatus());
        }
        return order;
    }

    private void broadcastOrderUpdate(Order order) {
        messagingTemplate.convertAndSend("/topic/orders", order);
    }
}
