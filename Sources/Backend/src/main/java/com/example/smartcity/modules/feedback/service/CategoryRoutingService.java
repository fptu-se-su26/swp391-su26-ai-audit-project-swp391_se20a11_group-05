package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.modules.core.entity.Ward;
import com.example.smartcity.modules.feedback.entity.Category;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
public class CategoryRoutingService {
    public static final String ROLE_POLICE = "POLICE";
    public static final String ROLE_WARD_STAFF = "WARD_STAFF";

    private static final Set<String> OFFICIAL_CODES = Set.of(
            "TRAFFIC",
            "URBAN_INFRASTRUCTURE",
            "ENVIRONMENT",
            "PUBLIC_SECURITY",
            "CONSTRUCTION",
            "FIRE_SAFETY"
    );

    private static final Map<String, String> ROLE_BY_CODE = Map.of(
            "TRAFFIC", ROLE_POLICE,
            "PUBLIC_SECURITY", ROLE_POLICE,
            "FIRE_SAFETY", ROLE_POLICE,
            "URBAN_INFRASTRUCTURE", ROLE_WARD_STAFF,
            "ENVIRONMENT", ROLE_WARD_STAFF,
            "CONSTRUCTION", ROLE_WARD_STAFF
    );

    public boolean isOfficialCode(String code) {
        return code != null && OFFICIAL_CODES.contains(code.trim().toUpperCase());
    }

    public String managedByRole(String code) {
        return code == null ? null : ROLE_BY_CODE.get(code.trim().toUpperCase());
    }

    public boolean isPoliceManaged(Category category) {
        String role = category == null ? null : category.getManagedByRole();
        return ROLE_POLICE.equals(role);
    }

    public void applyAssignment(Feedback feedback, Category category, Ward ward, LocalDateTime submittedAt) {
        String categoryCode = category.getCode();
        String managedByRole = managedByRole(categoryCode);
        String categoryName = category.getNameVi() != null ? category.getNameVi() : category.getName();

        feedback.setCategoryCode(categoryCode);
        feedback.setCategoryName(categoryName);
        feedback.setManagedByRole(managedByRole);
        feedback.setReceiverType(managedByRole);
        feedback.setSubmittedAt(submittedAt);

        if (ward == null) {
            feedback.setStatus(FeedbackStatus.NEED_LOCATION_REVIEW);
            feedback.setAssignedUnitId(null);
            feedback.setAssignedUnitName(null);
            feedback.setAssignedToRole(null);
            feedback.setWard(null);
            feedback.setWardName(null);
            feedback.setCityName(null);
            return;
        }

        feedback.setWard(ward);
        feedback.setWardName(ward.getName());
        feedback.setCityName(ward.getCityName());
        feedback.setAssignedUnitId(ward.getId());
        feedback.setAssignedToRole(managedByRole);
        feedback.setStatus(FeedbackStatus.PENDING_RECEIVE);

        if (ROLE_POLICE.equals(managedByRole)) {
            feedback.setAssignedUnitName(ward.getName() + " Ward Police");
        } else {
            feedback.setAssignedUnitName(ward.getName() + " Ward People's Committee");
        }
    }
}
