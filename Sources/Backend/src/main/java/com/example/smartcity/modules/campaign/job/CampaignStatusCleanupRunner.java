package com.example.smartcity.modules.campaign.job;

import com.example.smartcity.modules.campaign.entity.Campaign;
import com.example.smartcity.modules.campaign.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CampaignStatusCleanupRunner implements CommandLineRunner {

    private final CampaignRepository campaignRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("[CampaignStatusCleanupRunner] Checking for legacy mismatched campaign statuses...");
        LocalDateTime now = LocalDateTime.now();
        
        List<Campaign> mismatchedCampaigns = campaignRepository.findAll().stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus()) && c.getStartTime() != null && c.getStartTime().isAfter(now))
                .toList();

        if (!mismatchedCampaigns.isEmpty()) {
            log.info("[CampaignStatusCleanupRunner] Found {} campaigns in IN_PROGRESS status with future start times. Resetting them to RECRUITING...", mismatchedCampaigns.size());
            for (Campaign campaign : mismatchedCampaigns) {
                log.info("[CampaignStatusCleanupRunner] Resetting campaign ID={} ('{}') status from IN_PROGRESS -> RECRUITING (startTime: {})", 
                        campaign.getId(), campaign.getTitle(), campaign.getStartTime());
                campaign.setStatus("RECRUITING");
            }
            campaignRepository.saveAll(mismatchedCampaigns);
            log.info("[CampaignStatusCleanupRunner] Done aligning legacy campaigns.");
        } else {
            log.info("[CampaignStatusCleanupRunner] No legacy status mismatches found.");
        }
    }
}
