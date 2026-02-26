package com.cafe.erp.floor.presentation.rest;
import com.cafe.erp.floor.application.service.FloorService;
import com.cafe.erp.floor.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List; import java.util.Map; import java.util.UUID;

@RestController @RequestMapping("/floor") @RequiredArgsConstructor
public class FloorController {
    private final FloorService floorService;
    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<CafeTable>>> getTables() {
        return ResponseEntity.ok(ApiResponse.success(floorService.getAllTables()));
    }
    @PostMapping("/tables")
    @PreAuthorize("hasAnyRole('MANAGER','OWNER')")
    public ResponseEntity<ApiResponse<CafeTable>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(floorService.createTable(
                (String) body.get("name"), (Integer) body.getOrDefault("capacity", 4),
                (Integer) body.getOrDefault("posX", 0), (Integer) body.getOrDefault("posY", 0))));
    }
}
