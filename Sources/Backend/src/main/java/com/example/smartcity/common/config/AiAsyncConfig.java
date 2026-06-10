package com.example.smartcity.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionHandler;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AiAsyncConfig {

    private static final Logger log = LoggerFactory.getLogger(AiAsyncConfig.class);

    /**
     * [ENTERPRISE] In-Memory Message Queue cho AI
     * Chống OOM (hết RAM) và Lỗi Rate Limit 429 khi có lượng lớn Feedback gửi lên.
     */
    @Bean(name = "aiTaskExecutor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 1. Chỉ cho phép 2 tiến trình gọi Gemini API cùng lúc (Ngăn chặn 429 Rate Limit)
        executor.setCorePoolSize(2);
        
        // 2. Tối đa 4 tiến trình nếu hàng đợi quá tải
        executor.setMaxPoolSize(4);
        
        // 3. Giới hạn hàng đợi 1000 báo cáo. RAM chỉ lưu trữ tác vụ nhẹ, không lưu Base64 trước khi chạy.
        executor.setQueueCapacity(1000);
        
        executor.setThreadNamePrefix("AI-Queue-");
        
        // 4. Nếu hàng đợi đầy (>1000), xử lý êm đẹp (Graceful Degradation).
        // Không ném lỗi ra cho User, chỉ ghi log và bỏ qua tác vụ AI (Feedback sẽ tự động nằm ở trạng thái PENDING cho Cán bộ duyệt).
        executor.setRejectedExecutionHandler(new RejectedExecutionHandler() {
            @Override
            public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
                log.warn("🚨 [AI QUEUE FULL] Hàng đợi AI đã vượt quá 1000 tác vụ. Tác vụ AI này bị hủy. Phản ánh sẽ tự động chuyển sang luồng Duyệt Thủ Công (MANUAL_REVIEW).");
            }
        });
        
        executor.initialize();
        return executor;
    }
}
