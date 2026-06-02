package com.example.smartcity.modules.auth.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Response trả về sau login hoặc refresh thành công */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenPairResponse {
    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    /** Số giây còn lại của access token (15 phút = 900 giây) */
    private long expiresIn;

    private String username;
    private String role;
}
