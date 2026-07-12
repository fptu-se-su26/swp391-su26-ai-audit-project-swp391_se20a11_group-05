package com.example.smartcity.modules.analytics.job;

import com.example.smartcity.modules.analytics.service.WardRankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Scheduled job that calculates ward ranking on the 1st of each month at 2 AM.
 * Computes rankings for the previous month.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WardRankingJob {

    private final WardRankingService wardRankingService;

    @Scheduled(cron = "0 0 2 1 * *")
    public void calculatePreviousMonthRanking() {
        LocalDate lastMonth = LocalDate.now().minusMonths(1);
        int year = lastMonth.getYear();
        int month = lastMonth.getMonthValue();

        log.info("WardRankingJob triggered — calculating ranking for {}-{}", year, month);

        try {
            wardRankingService.calculateAndStoreMonthlyRanking(year, month);
            log.info("WardRankingJob completed successfully for {}-{}", year, month);
        } catch (Exception e) {
            log.error("WardRankingJob failed for {}-{}", year, month, e);
        }
    }
}
