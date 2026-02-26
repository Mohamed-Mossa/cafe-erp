package com.cafe.erp.inventory.infrastructure.persistence;
import com.cafe.erp.inventory.domain.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*; import java.util.UUID;
public interface PurchaseRepository extends JpaRepository<Purchase, UUID> {
    List<Purchase> findByInventoryItemIdOrderByCreatedAtDesc(UUID itemId);
}
