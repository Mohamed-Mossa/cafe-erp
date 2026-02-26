package com.cafe.erp.inventory.presentation.rest;
import com.cafe.erp.inventory.application.command.*;
import com.cafe.erp.inventory.application.service.InventoryService;
import com.cafe.erp.inventory.domain.model.InventoryItem;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/inventory") @RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;
    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllItems()));
    }
    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAlerts() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockAlerts()));
    }
    @PostMapping("/purchases")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> purchase(@Valid @RequestBody AddPurchaseRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.addPurchase(req)));
    }
    @PostMapping("/wastage")
    public ResponseEntity<ApiResponse<InventoryItem>> wastage(@Valid @RequestBody RecordWastageRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.recordWastage(req)));
    }
    @PostMapping("/count")
    @PreAuthorize("hasAnyRole('SUPERVISOR','MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<InventoryItem>> count(@Valid @RequestBody StockCountRequest req) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.stockCount(req)));
    }
}
