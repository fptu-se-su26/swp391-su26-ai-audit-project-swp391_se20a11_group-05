package com.example.smartcity.modules.user.entity;

import jakarta.persistence.*;
import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.common.security.AttributeEncryptor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;


@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 20, unique = true)
    private String phoneNumber;

    @Column(length = 100, unique = true)
    private String email;

    @Column(name = "citizen_id_card", length = 50, unique = true)
    private String citizenIdCard;

    @Column(name = "is_phone_verified", nullable = false)
    private boolean phoneVerified = false;

    @Column(name = "is_identity_verified", nullable = false)
    private boolean identityVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; 

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(name = "warning_count", nullable = false)
    private int warningCount = 0;

    // [SECURITY FIX] AES-256/GCM encrypted at rest via AttributeEncryptor
    @Convert(converter = AttributeEncryptor.class)
    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "is_mfa_enabled", nullable = false)
    private boolean isMfaEnabled = false;

    // [SECURITY] Brute-force login protection
    @Column(name = "login_attempts", nullable = false)
    private int loginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "login_lock_stage", nullable = false)
    private int loginLockStage = 0;

    @Column(name = "login_otp_required", nullable = false)
    private boolean loginOtpRequired = false;

    @Column(name = "last_failed_login_at")
    private LocalDateTime lastFailedLoginAt;

    // [SOFT DELETE] Managed by @SQLDelete + @Where — do not set manually
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    public User() {
    }

    public User(String username, String password, String fullName, String phoneNumber, String email, Role role) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.role = role;
        this.status = "ACTIVE";
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCitizenIdCard() { return citizenIdCard; }
    public void setCitizenIdCard(String citizenIdCard) { this.citizenIdCard = citizenIdCard; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public boolean isIdentityVerified() { return identityVerified; }
    public void setIdentityVerified(boolean identityVerified) { this.identityVerified = identityVerified; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(this.status);
    }
    public void setActive(boolean active) {
        this.status = active ? "ACTIVE" : "LOCKED";
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }

    public boolean isMfaEnabled() { return isMfaEnabled; }
    public void setMfaEnabled(boolean isMfaEnabled) { this.isMfaEnabled = isMfaEnabled; }

    public int getLoginAttempts() { return loginAttempts; }
    public void setLoginAttempts(int loginAttempts) { this.loginAttempts = loginAttempts; }

    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }

    public int getLoginLockStage() { return loginLockStage; }
    public void setLoginLockStage(int loginLockStage) { this.loginLockStage = loginLockStage; }

    public boolean isLoginOtpRequired() { return loginOtpRequired; }
    public void setLoginOtpRequired(boolean loginOtpRequired) { this.loginOtpRequired = loginOtpRequired; }

    public LocalDateTime getLastFailedLoginAt() { return lastFailedLoginAt; }
    public void setLastFailedLoginAt(LocalDateTime lastFailedLoginAt) { this.lastFailedLoginAt = lastFailedLoginAt; }

    public boolean isTemporarilyLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }

    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public String getDeletedBy() { return deletedBy; }
    public void setDeletedBy(String deletedBy) { this.deletedBy = deletedBy; }

    public int getWarningCount() { return warningCount; }
    public void setWarningCount(int warningCount) { this.warningCount = warningCount; }
}

