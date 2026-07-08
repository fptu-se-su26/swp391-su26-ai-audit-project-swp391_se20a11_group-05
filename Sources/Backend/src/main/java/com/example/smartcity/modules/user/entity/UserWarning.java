package com.example.smartcity.modules.user.entity;

import jakarta.persistence.*;
import com.example.smartcity.common.base.BaseEntity;

@Entity
@Table(name = "user_warnings")
public class UserWarning extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warned_by_id", nullable = false)
    private User warnedBy;

    @Column(nullable = false, length = 500)
    private String reason;

    public UserWarning() {
    }

    public UserWarning(User user, User warnedBy, String reason) {
        this.user = user;
        this.warnedBy = warnedBy;
        this.reason = reason;
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public User getWarnedBy() { return warnedBy; }
    public void setWarnedBy(User warnedBy) { this.warnedBy = warnedBy; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
