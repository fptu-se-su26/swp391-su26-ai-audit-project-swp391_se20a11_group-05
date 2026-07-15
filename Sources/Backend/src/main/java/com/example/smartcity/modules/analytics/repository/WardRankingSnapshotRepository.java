package com.example.smartcity.modules.analytics.repository;

import com.example.smartcity.modules.analytics.entity.WardRankingSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WardRankingSnapshotRepository extends JpaRepository<WardRankingSnapshot, Long> {

    List<WardRankingSnapshot> findByPeriodYearAndPeriodMonthOrderByRankPositionAsc(int year, int month);

    List<WardRankingSnapshot> findByWardIdOrderByPeriodYearDescPeriodMonthDesc(Long wardId);

    Optional<WardRankingSnapshot> findByWardIdAndPeriodYearAndPeriodMonth(Long wardId, int year, int month);

    void deleteByPeriodYearAndPeriodMonth(int year, int month);
}
