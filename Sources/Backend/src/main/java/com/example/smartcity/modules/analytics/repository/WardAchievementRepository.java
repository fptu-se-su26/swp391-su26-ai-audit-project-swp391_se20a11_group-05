package com.example.smartcity.modules.analytics.repository;

import com.example.smartcity.modules.analytics.entity.WardAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WardAchievementRepository extends JpaRepository<WardAchievement, Long> {

    List<WardAchievement> findByWardId(Long wardId);

    List<WardAchievement> findByPeriodYearAndPeriodMonth(int year, int month);

    void deleteByPeriodYearAndPeriodMonth(int year, int month);
}
