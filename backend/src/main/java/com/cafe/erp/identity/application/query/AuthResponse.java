package com.cafe.erp.identity.application.query;

import com.cafe.erp.identity.domain.model.Role;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UUID userId,
        String username,
        String fullName,
        Role role,
        int maxDiscountPercent
) {
    public AuthResponse {
        tokenType = "Bearer";
    }
}
