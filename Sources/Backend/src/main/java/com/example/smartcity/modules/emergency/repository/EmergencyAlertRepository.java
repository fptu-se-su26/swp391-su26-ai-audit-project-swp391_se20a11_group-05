package com.example.smartcity.modules.emergency.repository;

import com.example.smartcity.modules.emergency.entity.EmergencyAlert;
import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertLevel;
import com.example.smartcity.modules.emergency.entity.EmergencyAlert.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmergencyAlertRepository extends JpaRepository<EmergencyAlert, Long> {

    List<EmergencyAlert> findByStatus(AlertStatus status);

    List<EmergencyAlert> findByDistrict(String district);

    List<EmergencyAlert> findByDistrictAndStatus(String district, AlertStatus status);

    List<EmergencyAlert> findByLevel(AlertLevel level);

    @Query("SELECT e FROM EmergencyAlert e WHERE e.status = 'ACTIVE' AND (e.expiresAt IS NULL OR e.expiresAt > :now)")
    List<EmergencyAlert> findActiveAlerts(@Param("now") LocalDateTime now);

    @Query("SELECT e FROM EmergencyAlert e WHERE e.status = 'ACTIVE' AND e.district = :district AND (e.expiresAt IS NULL OR e.expiresAt > :now)")
    List<EmergencyAlert> findActiveAlertsByDistrict(@Param("district") String district, @Param("now") LocalDateTime now);

    List<EmergencyAlert> findAllByOrderByCreatedAtDesc();
}
