package com.example.smartcity.modules.auth.entity;

import com.example.smartcity.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_verifications", indexes = {
    // [UPGRADE] Đánh Index kép để tối ưu tốc độ truy vấn hàm findByPhoneNumberAndIsUsedFalse cho bảng 5 triệu records
    @Index(name = "idx_phone_is_used", columnList = "phone_number, is_used")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    // [UPGRADE] Tăng độ dài để lưu chuỗi Hash (BCrypt) thay vì lưu mã Plaintext dễ bị lộ
    @Column(name = "otp_code", nullable = false, length = 255)
    private String otpCode;

    @Column(name = "purpose", nullable = false, length = 30)
    @Builder.Default
    private String purpose = "LOGIN";

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "attempts")
    @Builder.Default
    private Integer attempts = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
