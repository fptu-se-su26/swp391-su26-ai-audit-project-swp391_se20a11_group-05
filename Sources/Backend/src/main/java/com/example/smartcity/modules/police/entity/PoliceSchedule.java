package com.example.smartcity.modules.police.entity;

import com.example.smartcity.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "police_schedules",
    uniqueConstraints = @UniqueConstraint(columnNames = {"ward_id", "monday_key"})
)
public class PoliceSchedule extends BaseEntity {

    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    @Column(name = "monday_key", nullable = false, length = 20)
    private String mondayKey;

    @Column(name = "schedule_data", nullable = false, columnDefinition = "TEXT")
    private String scheduleData;

    public PoliceSchedule() {
    }

    public PoliceSchedule(Long wardId, String mondayKey, String scheduleData) {
        this.wardId = wardId;
        this.mondayKey = mondayKey;
        this.scheduleData = scheduleData;
    }

    public Long getWardId() {
        return wardId;
    }

    public void setWardId(Long wardId) {
        this.wardId = wardId;
    }

    public String getMondayKey() {
        return mondayKey;
    }

    public void setMondayKey(String mondayKey) {
        this.mondayKey = mondayKey;
    }

    public String getScheduleData() {
        return scheduleData;
    }

    public void setScheduleData(String scheduleData) {
        this.scheduleData = scheduleData;
    }
}
