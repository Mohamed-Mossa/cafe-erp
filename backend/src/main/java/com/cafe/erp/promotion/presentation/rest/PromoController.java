package com.cafe.erp.promotion.presentation.rest;
import com.cafe.erp.promotion.application.command.CreatePromoRequest;
import com.cafe.erp.promotion.application.service.PromoService;
import com.cafe.erp.promotion.domain.model.PromoCode;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal; import java.util.*;

@RestController @RequestMapping("/promos") @RequiredArgsConstructor
public class PromoController {
    private final PromoService promoService;
    @GetMapping
    public ResponseEntity<ApiResponse<List<PromoCode>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(promoService.getActivePromos()));
    }
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<PromoCode>> create(@Valid @RequestBody CreatePromoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Promo created", promoService.createPromo(req)));
    }
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromoService.PromoValidationResult>> validate(
            @RequestParam String code, @RequestParam BigDecimal orderAmount) {
        return ResponseEntity.ok(ApiResponse.success(promoService.validateAndApply(code, orderAmount)));
    }
}
