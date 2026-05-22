package com.example.smartcity.modules.user.entity;

import jakarta.persistence.*;
import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.core.entity.Ward;


@Entity
@Table(name = "users")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role; 

    @Column(nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @Column(name = "mfa_secret")
    private String mfaSecret;

    @Column(name = "is_mfa_enabled", nullable = false)
    private boolean isMfaEnabled = false;

    public User() {
    }

    public User(String username, String password, String fullName, String phoneNumber, String email, Role role) {
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.role = role;
        this.isActive = true;
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

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }

    public boolean isMfaEnabled() { return isMfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.isMfaEnabled = mfaEnabled; }

    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }
}



