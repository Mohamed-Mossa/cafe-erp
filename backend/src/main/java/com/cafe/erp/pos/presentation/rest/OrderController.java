package com.cafe.erp.pos.presentation.rest;

import com.cafe.erp.pos.application.command.*;
import com.cafe.erp.pos.application.service.OrderService;
import com.cafe.erp.pos.domain.model.Order;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/open")
    public ResponseEntity<ApiResponse<List<Order>>> getOpenOrders() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOpenOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrder(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(@Valid @RequestBody CreateOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created", orderService.createOrder(req)));
    }

    @PostMapping("/{id}/lines")
    public ResponseEntity<ApiResponse<Order>> addLine(
            @PathVariable UUID id,
            @Valid @RequestBody AddLineRequest req) {
        return ResponseEntity.ok(ApiResponse.success(orderService.addLine(id, req)));
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Order>> removeLine(
            @PathVariable UUID id,
            @PathVariable UUID lineId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.removeLine(id, lineId)));
    }

    @PostMapping("/{id}/discount")
    public ResponseEntity<ApiResponse<Order>> applyDiscount(
            @PathVariable UUID id,
            @Valid @RequestBody ApplyDiscountRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Resolve max discount for current user — simplified here
        // In production, extract from JWT claim
        int maxDiscount = 5; // default cashier; override from token
        return ResponseEntity.ok(ApiResponse.success(
                orderService.applyManualDiscount(id, req, maxDiscount)));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<Order>> processPayment(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessPaymentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Payment processed",
                orderService.processPayment(id, req)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        orderService.cancelOrder(id, reason);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
