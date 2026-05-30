package com.example.smartcity.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for JwtTokenProvider.
 * Uses a 64-byte (512-bit) key to satisfy HS512 requirements.
 */
class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    // HS512 requires key >= 512 bits = 64 bytes
    private static final String TEST_SECRET = "ThisIsATestSecretKeyThatIsExactly512BitsLongForHS512Algorithm!!!!";
    private static final long EXPIRATION = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationInMs", EXPIRATION);
    }

    @Test
    @DisplayName("Should generate valid JWT token from username")
    void generateTokenFromUsername() {
        String token = tokenProvider.generateTokenFromUsername("testuser");
        assertNotNull(token);
        assertTrue(token.startsWith("eyJ"));
    }

    @Test
    @DisplayName("Should generate valid JWT token from Authentication with UserDetails principal")
    void generateToken() {
        UserDetails userDetails = User.builder()
                .username("testuser")
                .password("pass")
                .authorities(List.of())
                .build();
        Authentication auth = new org.springframework.security.authentication
                .UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        String token = tokenProvider.generateToken(auth);
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Should extract username from JWT token")
    void getUsernameFromJWT() {
        String token = tokenProvider.generateTokenFromUsername("testuser");
        String username = tokenProvider.getUsernameFromJWT(token);
        assertEquals("testuser", username);
    }

    @Test
    @DisplayName("Should validate valid token")
    void validateToken_valid() {
        String token = tokenProvider.generateTokenFromUsername("testuser");
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Should reject malformed token")
    void validateToken_malformed() {
        assertFalse(tokenProvider.validateToken("invalid.jwt.token"));
    }

    @Test
    @DisplayName("Should reject empty token")
    void validateToken_empty() {
        assertFalse(tokenProvider.validateToken(""));
    }

    @Test
    @DisplayName("Should reject null token")
    void validateToken_null() {
        assertFalse(tokenProvider.validateToken(null));
    }
}
