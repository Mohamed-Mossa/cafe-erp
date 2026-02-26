package com.cafe.erp.inventory.application.service;
import com.cafe.erp.inventory.application.command.*;
import com.cafe.erp.inventory.domain.model.*;
import com.cafe.erp.inventory.infrastructure.persistence.*;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal; import java.math.RoundingMode; import java.time.LocalDate;
import java.util.*; import java.util.UUID;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

@Service @RequiredArgsConstructor
public class InventoryService {
    private final InventoryItemRepository itemRepository;
    private final StockLedgerRepository ledgerRepository;
    private final PurchaseRepository purchaseRepository;
    private final WastageRepository wastageRepository;

    public List<InventoryItem> getAllItems() { return itemRepository.findByDeletedFalseOrderByName(); }
    public List<InventoryItem> getLowStockAlerts() { return itemRepository.findLowStockItems(); }

    @Transactional
    public InventoryItem addPurchase(AddPurchaseRequest req) {
        InventoryItem item = itemRepository.findById(req.getInventoryItemId())
                .orElseThrow(() -> BusinessException.notFound("Inventory item"));

        BigDecimal totalCost = req.getUnitCost().multiply(req.getQuantity()).setScale(2, RoundingMode.HALF_UP);
        Purchase purchase = Purchase.builder().inventoryItemId(item.getId()).itemName(item.getName())
                .quantity(req.getQuantity()).unit(item.getUnit()).unitCost(req.getUnitCost())
                .totalCost(totalCost).supplierName(req.getSupplierName())
                .invoiceNumber(req.getInvoiceNumber())
                .purchaseDate(req.getPurchaseDate() != null ? req.getPurchaseDate() : LocalDate.now()).build();
        purchaseRepository.save(purchase);

        // Update running average cost
        BigDecimal newStock = item.getCurrentStock().add(req.getQuantity());
        BigDecimal newAvgCost = item.getCurrentStock().multiply(item.getAverageCost())
                .add(totalCost).divide(newStock, 4, RoundingMode.HALF_UP);
        item.setAverageCost(newAvgCost);
        item.setCurrentStock(newStock);
        addLedgerEntry(item.getId(), req.getQuantity(), "PURCHASE", purchase.getId(), null, newStock);
        return itemRepository.save(item);
    }

    @Transactional
    public InventoryItem recordWastage(RecordWastageRequest req) {
        InventoryItem item = itemRepository.findById(req.getInventoryItemId())
                .orElseThrow(() -> BusinessException.notFound("Inventory item"));
        if (item.getCurrentStock().compareTo(req.getQuantity()) < 0)
            throw new BusinessException("Cannot record wastage greater than current stock");

        String username = SecurityUtils.currentUsername();
        Wastage wastage = Wastage.builder().inventoryItemId(item.getId()).itemName(item.getName())
                .quantity(req.getQuantity()).unit(item.getUnit()).reason(req.getReason())
                .reportedBy(username).build();
        wastageRepository.save(wastage);

        BigDecimal newStock = item.getCurrentStock().subtract(req.getQuantity());
        item.setCurrentStock(newStock);
        addLedgerEntry(item.getId(), req.getQuantity().negate(), "WASTAGE", wastage.getId(), req.getReason(), newStock);
        return itemRepository.save(item);
    }

    @Transactional
    public InventoryItem stockCount(StockCountRequest req) {
        InventoryItem item = itemRepository.findById(req.getInventoryItemId())
                .orElseThrow(() -> BusinessException.notFound("Inventory item"));
        BigDecimal diff = req.getActualCount().subtract(item.getCurrentStock());
        item.setCurrentStock(req.getActualCount());
        addLedgerEntry(item.getId(), diff, "COUNT", null, "Physical count: " + req.getNotes(), req.getActualCount());
        return itemRepository.save(item);
    }

    /** Called after order payment to deduct recipe ingredients */
    @Transactional
    public void deductForOrder(UUID productId, int quantity, UUID orderId) {
        // This would connect to RecipeRepository — simplified here
        // Full implementation queries recipe ingredients and deducts each
    }

    private void addLedgerEntry(UUID itemId, BigDecimal qty, String type, UUID refId, String notes, BigDecimal balance) {
        String username = SecurityUtils.currentUsername();
        ledgerRepository.save(StockLedger.builder().inventoryItemId(itemId).quantity(qty)
                .transactionType(type).referenceId(refId).notes(notes)
                .balanceAfter(balance).createdBy(username).build());
    }
}
