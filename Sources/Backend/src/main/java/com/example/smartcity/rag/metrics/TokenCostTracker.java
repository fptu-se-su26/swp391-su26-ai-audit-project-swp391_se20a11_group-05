package com.example.smartcity.rag.metrics;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Enterprise Feature: Thread-safe Token Cost Tracking.
 * Đếm số lượng Token sử dụng và quy đổi ra chi phí (USD) một cách an toàn
 * trong môi trường đa luồng (Virtual Threads / High Concurrency)
 * Sử dụng AtomicLong và CAS (Compare And Set) để chống Race Condition (Issue #3).
 */
@Component
@Slf4j
public class TokenCostTracker {

    private final AtomicLong totalInputTokens = new AtomicLong(0);
    private final AtomicLong totalOutputTokens = new AtomicLong(0);
    
    // Lưu trữ tổng chi phí dưới dạng micro-cents (1 USD = 1,000,000 micro-cents) để tránh sai số dấu phẩy động
    private final AtomicLong totalCostMicroCents = new AtomicLong(0);

    // Cờ đánh dấu đã gửi cảnh báo ngân sách (budget alert)
    private final AtomicBoolean budgetAlertTriggered = new AtomicBoolean(false);

    // Mức cảnh báo ngân sách: $100.00
    private static final long BUDGET_THRESHOLD_MICRO_CENTS = 100_000_000L;

    /**
     * Ghi nhận số lượng token sử dụng cho một request.
     * Thread-safe bằng lock-free atomic operations.
     */
    public void recordUsage(long inputTokens, long outputTokens, double costPer1kInput, double costPer1kOutput) {
        totalInputTokens.addAndGet(inputTokens);
        totalOutputTokens.addAndGet(outputTokens);

        // Tính toán chi phí cho request này bằng BigDecimal để tránh sai số
        BigDecimal inputTokensBd = BigDecimal.valueOf(inputTokens);
        BigDecimal outputTokensBd = BigDecimal.valueOf(outputTokens);
        
        BigDecimal costInput = inputTokensBd.divide(BigDecimal.valueOf(1000), 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(costPer1kInput));
        BigDecimal costOutput = outputTokensBd.divide(BigDecimal.valueOf(1000), 10, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(costPer1kOutput));
        
        BigDecimal requestTotalCost = costInput.add(costOutput);
        
        // Chuyển sang micro-cents
        long microCents = requestTotalCost.multiply(BigDecimal.valueOf(1_000_000)).longValue();

        long currentTotalCost = totalCostMicroCents.addAndGet(microCents);

        checkAndTriggerBudgetAlert(currentTotalCost);
    }

    /**
     * Kiểm tra và trigger cảnh báo ngân sách (Idempotent: chỉ trigger đúng 1 lần).
     * Sử dụng CAS (Compare-And-Swap) qua AtomicReference để chống race condition.
     */
    private void checkAndTriggerBudgetAlert(long currentTotalCost) {
        if (currentTotalCost > BUDGET_THRESHOLD_MICRO_CENTS) {
            // Chỉ đổi cờ từ false -> true được 1 lần duy nhất
            if (budgetAlertTriggered.compareAndSet(false, true)) {
                double costInUsd = currentTotalCost / 1_000_000.0;
                log.error("🚨 [BUDGET ALERT] Chi phí API đã vượt quá giới hạn $100! (Hiện tại: ${})", 
                          String.format("%.2f", costInUsd));
                // TODO: Tích hợp với NotificationService để gửi email/slack cho Admin
            }
        }
    }

    public double getTotalCostUsd() {
        return totalCostMicroCents.get() / 1_000_000.0;
    }
    
    public long getTotalInputTokens() {
        return totalInputTokens.get();
    }
    
    public long getTotalOutputTokens() {
        return totalOutputTokens.get();
    }
}
