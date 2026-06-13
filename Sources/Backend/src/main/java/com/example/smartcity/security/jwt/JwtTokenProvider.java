package com.example.smartcity.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.SecureRandom;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {
    private final com.example.smartcity.security.secrets.SecurityManager securityManager;

    @Value("${jwt.expiration-ms:604800000}")
    private long jwtExpirationInMs; // 7 days default

    // Bắt buộc khai báo Constructor để Spring Inject vì có class con/Test sử dụng
    public JwtTokenProvider(com.example.smartcity.security.secrets.SecurityManager securityManager) {
        this.securityManager = securityManager;
    }

    private Key getSigningKey() {
        String jwtSecret = securityManager.getSecret("jwt.secret");
        if (jwtSecret == null || jwtSecret.isBlank()) {
            log.error("JWT_SECRET is missing! System cannot sign tokens securely.");
            throw new IllegalStateException("CRITICAL: jwt.secret must be provided via SecurityManager!");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateTokenFromUsername(userPrincipal.getUsername());
    }

    public String generateTokenFromUsername(String username) {
        Date now = new Date();
        // [SECURITY FIX] Add Jitter (± 1 minute) to prevent Thundering Herd on refresh
        int jitterMinutes = new SecureRandom().nextInt(3) - 1; 
        long jitterMs = jitterMinutes * 60 * 1000L;
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs + jitterMs);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setAllowedClockSkewSeconds(30) // [SECURITY FIX] Allow 30s clock skew
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * [SECURITY FIX] Trích xuất username ngay cả khi JWT đã hết hạn (phục vụ cho luồng Logout)
     */
    public String getUsernameFromExpiredJWT(String token) {
        try {
            return getUsernameFromJWT(token);
        } catch (ExpiredJwtException e) {
            return e.getClaims().getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public Date getExpirationFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setAllowedClockSkewSeconds(30) // [SECURITY FIX] Allow 30s clock skew
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getExpiration();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .setAllowedClockSkewSeconds(30) // [SECURITY FIX] Allow 30s clock skew
                .build()
                .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty.");
        }
        return false;
    }
}


