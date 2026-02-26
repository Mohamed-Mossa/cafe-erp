package com.cafe.erp.menu.presentation.rest;

import com.cafe.erp.menu.application.command.*;
import com.cafe.erp.menu.application.service.MenuService;
import com.cafe.erp.menu.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getActiveCategories()));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<Product>>> getProducts(@RequestParam(required = false) UUID categoryId) {
        List<Product> products = categoryId != null
                ? menuService.getProductsByCategory(categoryId)
                : menuService.getMatchModeProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/match-mode")
    public ResponseEntity<ApiResponse<List<Product>>> getMatchModeProducts() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getMatchModeProducts()));
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", menuService.createProduct(req)));
    }

    @PatchMapping("/products/{id}/price")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Product>> updatePrice(
            @PathVariable UUID id, @Valid @RequestBody UpdatePriceRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Price updated", menuService.updatePrice(id, req)));
    }

    @PatchMapping("/products/{id}/toggle")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<Void>> toggle(@PathVariable UUID id) {
        menuService.toggleProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
