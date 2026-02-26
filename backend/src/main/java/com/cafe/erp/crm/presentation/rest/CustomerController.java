package com.cafe.erp.crm.presentation.rest;
import com.cafe.erp.crm.application.command.*;
import com.cafe.erp.crm.application.service.CustomerService;
import com.cafe.erp.crm.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.*; import java.util.UUID;

@RestController @RequestMapping("/customers") @RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<Customer>> lookup(@RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(customerService.lookupByPhone(phone)));
    }
    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> create(@Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Customer created", customerService.createCustomer(req)));
    }
    @PostMapping("/{id}/redeem")
    public ResponseEntity<ApiResponse<BigDecimal>> redeem(@PathVariable UUID id, @Valid @RequestBody RedeemPointsRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Points redeemed", customerService.redeemPoints(id, req)));
    }
    @GetMapping("/{id}/points")
    public ResponseEntity<ApiResponse<List<PointTransaction>>> getPoints(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getPointHistory(id)));
    }
}
