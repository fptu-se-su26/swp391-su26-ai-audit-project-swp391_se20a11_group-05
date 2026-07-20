package com.example.smartcity.modules.police.repository;

import com.example.smartcity.modules.police.entity.PoliceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PoliceScheduleRepository extends JpaRepository<PoliceSchedule, Long> {
    Optional<PoliceSchedule> findByWardIdAndMondayKey(Long wardId, String mondayKey);
}
