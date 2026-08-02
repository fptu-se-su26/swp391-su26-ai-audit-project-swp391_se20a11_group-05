package com.example.smartcity.modules.feedback.entity;

import com.example.smartcity.common.base.BaseEntity;
import com.example.smartcity.modules.user.entity.User;
import com.example.smartcity.modules.core.entity.Ward;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks", indexes = {
    @Index(name = "idx_feedback_status", columnList = "status"),
    @Index(name = "idx_feedback_public", columnList = "publicVisible"),
    @Index(name = "idx_feedback_created", columnList = "createdAt"),
    @Index(name = "idx_feedback_category", columnList = "category_id"),
    @Index(name = "idx_feedback_ward", columnList = "ward_id")
})
public class Feedback extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String trackingCode; 

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private Double latitude;
    private Double longitude;

    @Column(length = 255)
    private String addressDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackStatus status = FeedbackStatus.PENDING;

    @Column(nullable = false, length = 20)
    private String receiverType = "WARD_STAFF";

    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM";

    @Column(length = 30)
    private String source = "CITIZEN_APP";

    @Column(name = "category_code", length = 80)
    private String categoryCode;

    @Column(name = "category_name", length = 255)
    private String categoryName;

    @Column(name = "managed_by_role", length = 30)
    private String managedByRole;

    @Column(name = "ward_name", length = 255)
    private String wardName;

    @Column(name = "city_name", length = 255)
    private String cityName;

    @Column(name = "assigned_unit_id")
    private Long assignedUnitId;

    @Column(name = "assigned_unit_name", length = 255)
    private String assignedUnitName;

    @Column(name = "assigned_to_role", length = 30)
    private String assignedToRole;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    private LocalDateTime resolvedAt;

    @Column(columnDefinition = "TEXT")
    private String resolutionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @Column(name = "public_visible", nullable = false)
    private Boolean publicVisible = true;

    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    @Transient
    private User assignee;

    public Feedback() {}

    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getAddressDetails() { return addressDetails; }
    public void setAddressDetails(String addressDetails) { this.addressDetails = addressDetails; }
    public FeedbackStatus getStatus() { return status; }
    public void setStatus(FeedbackStatus status) { this.status = status; }
    public String getReceiverType() { return receiverType; }
    public void setReceiverType(String receiverType) { this.receiverType = receiverType; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getCategoryCode() { return categoryCode; }
    public void setCategoryCode(String categoryCode) { this.categoryCode = categoryCode; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getManagedByRole() { return managedByRole; }
    public void setManagedByRole(String managedByRole) { this.managedByRole = managedByRole; }
    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }
    public String getCityName() { return cityName; }
    public void setCityName(String cityName) { this.cityName = cityName; }
    public Long getAssignedUnitId() { return assignedUnitId; }
    public void setAssignedUnitId(Long assignedUnitId) { this.assignedUnitId = assignedUnitId; }
    public String getAssignedUnitName() { return assignedUnitName; }
    public void setAssignedUnitName(String assignedUnitName) { this.assignedUnitName = assignedUnitName; }
    public String getAssignedToRole() { return assignedToRole; }
    public void setAssignedToRole(String assignedToRole) { this.assignedToRole = assignedToRole; }
    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public Ward getWard() { return ward; }
    public void setWard(Ward ward) { this.ward = ward; }
    public User getCitizen() { return citizen; }
    public void setCitizen(User citizen) { this.citizen = citizen; }
    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }
    public Boolean getPublicVisible() { return publicVisible; }
    public void setPublicVisible(Boolean publicVisible) { this.publicVisible = publicVisible; }
    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }
}





