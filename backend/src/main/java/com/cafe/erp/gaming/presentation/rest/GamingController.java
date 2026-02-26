package com.cafe.erp.gaming.presentation.rest;
import com.cafe.erp.gaming.application.GamingService;
import com.cafe.erp.gaming.application.command.*;
import com.cafe.erp.gaming.domain.model.*;
import com.cafe.erp.shared.domain.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController @RequestMapping("/gaming") @RequiredArgsConstructor
public class GamingController {
    private final GamingService gamingService;
    @GetMapping("/devices") public ResponseEntity<ApiResponse<List<Device>>> getDevices() {
        return ResponseEntity.ok(ApiResponse.success(gamingService.getAllDevices())); }
    @GetMapping("/sessions/active") public ResponseEntity<ApiResponse<List<GamingSession>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(gamingService.getActiveSessions())); }
    @PostMapping("/sessions") public ResponseEntity<ApiResponse<GamingSession>> start(@Valid @RequestBody StartSessionRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Session started", gamingService.startSession(req))); }
    @PatchMapping("/sessions/{id}/type") public ResponseEntity<ApiResponse<GamingSession>> switchType(
            @PathVariable UUID id, @Valid @RequestBody SwitchTypeRequest req) {
        return ResponseEntity.ok(ApiResponse.success(gamingService.switchType(id, req))); }
    @PostMapping("/sessions/{id}/end") public ResponseEntity<ApiResponse<GamingSession>> end(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Session ended", gamingService.endSession(id))); }
}
