package com.cafe.erp.floor.application.service;
import com.cafe.erp.floor.domain.model.*;
import com.cafe.erp.floor.infrastructure.persistence.CafeTableRepository;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List; import java.util.UUID;

@Service @RequiredArgsConstructor
public class FloorService {
    private final CafeTableRepository tableRepository;
    private final SimpMessagingTemplate messaging;

    public List<CafeTable> getAllTables() { return tableRepository.findByDeletedFalseOrderByName(); }

    @Transactional
    public CafeTable updateTableStatus(UUID tableId, TableStatus status, UUID orderId) {
        CafeTable table = tableRepository.findById(tableId).orElseThrow(() -> BusinessException.notFound("Table"));
        table.setStatus(status);
        table.setCurrentOrderId(status == TableStatus.FREE ? null : orderId);
        CafeTable saved = tableRepository.save(table);
        messaging.convertAndSend("/topic/tables", saved);
        return saved;
    }

    @Transactional
    public CafeTable createTable(String name, int capacity, int posX, int posY) {
        return tableRepository.save(CafeTable.builder().name(name).capacity(capacity).positionX(posX).positionY(posY).build());
    }
}
