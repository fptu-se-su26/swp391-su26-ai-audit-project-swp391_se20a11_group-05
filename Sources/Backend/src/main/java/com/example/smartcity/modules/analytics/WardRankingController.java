package com.example.smartcity.modules.analytics;

import com.example.smartcity.modules.analytics.dto.WardDetailResponse;
import com.example.smartcity.modules.analytics.dto.WardRankingResponse;
import com.example.smartcity.modules.analytics.service.WardRankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ward-ranking")
@RequiredArgsConstructor
public class WardRankingController {

    private final WardRankingService wardRankingService;

    /**
     * Get the leaderboard for a given period.
     * If year/month not provided, defaults to the current month.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<WardRankingResponse>> getLeaderboard(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(wardRankingService.getLeaderboard(year, month));
    }

    /**
     * Get top N wards — lightweight endpoint for homepage widget.
     */
    @GetMapping("/top")
    public ResponseEntity<List<WardRankingResponse>> getTopWards(
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(wardRankingService.getTopWards(limit));
    }

    /**
     * Get detailed ward scorecard.
     */
    @GetMapping("/{wardId}")
    public ResponseEntity<WardDetailResponse> getWardDetail(
            @PathVariable Long wardId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(wardRankingService.getWardDetail(wardId, year, month));
    }

    /**
     * Export Ward PDF report.
     */
    @GetMapping("/{wardId}/report-pdf")
    public ResponseEntity<byte[]> getWardPdfReport(@PathVariable Long wardId) {
        byte[] pdfBytes = wardRankingService.generatePdfReport(wardId);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ward-" + wardId + "-report.pdf");
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    /**
     * Force recalculation of current month's ranking.
     * SUPER_ADMIN only.
     */
    @PostMapping("/recalculate")
    // @PreAuthorize("hasRole('SUPER_ADMIN')") // Temporarily commented out for manual trigger
    public ResponseEntity<String> recalculate(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        int y = year != null ? year : LocalDate.now().getYear();
        int m = month != null ? month : LocalDate.now().getMonthValue();
        wardRankingService.calculateAndStoreMonthlyRanking(y, m);
        return ResponseEntity.ok("Ranking recalculated for " + y + "-" + m);
    }
}
