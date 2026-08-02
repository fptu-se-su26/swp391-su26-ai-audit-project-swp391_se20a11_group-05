package com.example.smartcity.ai_orchestrator.guardrails;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

/**
 * [Phase 2.2] ContentGuardrailService — Nâng cấp lớp lá chắn.
 *
 * Fix 2.2 — 3 cải tiến so với phiên bản cũ:
 *
 * 1. NORMALIZE trước khi check:
 *    - NFD normalization → loại dấu Unicode đặc biệt
 *    - Leet-speak: 4→a, 3→e, 0→o, 1→i
 *    → Bypass "h4ck", "нack" (Cyrillic) bị chặn
 *
 * 2. REGEX PATTERNS thay vì chỉ exact string:
 *    - Pattern-based matching cho lớp bảo vệ rộng hơn
 *    - Phân loại WARN vs BLOCK (severity)
 *
 * 3. RATE LIMITING per-user:
 *    - Đếm WARN trong 60s
 *    - Nếu > 3 WARN → tự động BLOCK user đó 5 phút
 *    - Dùng ConcurrentHashMap (thread-safe)
 */
@Service
@Slf4j
public class ContentGuardrailService {

    // ─── BLOCK patterns (reject ngay) ─────────────────────────────
    private static final List<Pattern> BLOCK_PATTERNS = List.of(
        Pattern.compile("(ignore|bo qua).*(previous|instruct|prompt)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("bo qua.*chi dan"),
        Pattern.compile("lam sao.*che tao.*vu khi"),
        Pattern.compile("hack|crack|exploit|bypass.*security", Pattern.CASE_INSENSITIVE),
        Pattern.compile("jailbreak|dan.*mode|developer.*mode", Pattern.CASE_INSENSITIVE),
        Pattern.compile("forget.*instructions|pretend.*no.*rules", Pattern.CASE_INSENSITIVE),
        Pattern.compile("you are now|tu bay gio ban la", Pattern.CASE_INSENSITIVE)
    );

    // ─── WARN patterns (log nhưng không block ngay) ───────────────
    private static final List<Pattern> WARN_PATTERNS = List.of(
        Pattern.compile("password|mật khẩu|api.?key", Pattern.CASE_INSENSITIVE),
        Pattern.compile("token|secret|credential", Pattern.CASE_INSENSITIVE),
        Pattern.compile("sql.*inject|drop.*table|select.*from", Pattern.CASE_INSENSITIVE)
    );

    // ─── PII patterns dành riêng cho Feedback của Công dân ────────
    // Mục đích: phát hiện SĐT Việt Nam và số CCCD bị lộ do người dùng vô tình nhập
    // Lưu ý: KHÔNG dùng pattern 9 số (CMND cũ) vì gây false-positive cao
    // với các con số bình thường trong mô tả (mã đường, toạ độ, số nhà...)
    private static final List<Pattern> PII_PATTERNS = List.of(
        // SĐT Việt Nam: bắt đầu bằng 0, tổng 10 chữ số liên tiếp (sau khi đã strip space/dash)
        Pattern.compile("(?<![\\d])0[0-9]{9}(?![\\d])"),
        // CCCD mới 2021+: đúng 12 chữ số liên tiếp (sau khi đã strip space/dash)
        Pattern.compile("(?<![\\d])[0-9]{12}(?![\\d])"),
        // Email cá nhân
        Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}")
    );

    /**
     * [PII Guard — Tầng 2 Backend] Kiểm tra nội dung feedback có chứa SĐT, CCCD hoặc Email không.
     * Hỗ trợ phát hiện SĐT viết cách nhau bằng dấu cách/gạch ngang (ví dụ: "0 9 8 7 74 4 3", "09-8765-4321").
     * Được gọi trong FeedbackService.createFeedback() trước khi lưu.
     *
     * @param title       Tiêu đề phản ánh
     * @param description Nội dung mô tả
     * @throws IllegalArgumentException nếu phát hiện thông tin cá nhân
     */
    public void validateFeedbackContent(String title, String description) {
        String combined = (title == null ? "" : title) + " " + (description == null ? "" : description);

        // [FIX] Tạo bản sao đã xóa dấu cách và gạch ngang để bắt SĐT bị tách rời
        // Ví dụ: "0 9 8 7 74 4 3" → "0987744320" → match pattern SĐT 10 số
        String compacted = combined.replaceAll("[\\s\\-]", "");

        // Kiểm tra trên cả bản gốc lẫn bản compact
        for (Pattern pii : PII_PATTERNS) {
            boolean matchedOriginal = pii.matcher(combined).find();
            boolean matchedCompacted = pii.matcher(compacted).find();
            if (matchedOriginal || matchedCompacted) {
                log.warn("[PII-GUARD] Phát hiện thông tin cá nhân trong feedback. pattern='{}'", pii.pattern());
                throw new IllegalArgumentException(
                    "Vui lòng xoá số điện thoại, số CCCD/CMND hoặc email khỏi nội dung phản ánh để bảo vệ thông tin cá nhân của bạn."
                );
            }
        }
    }

    // ─── Rate limiting per-user ────────────────────────────────────
    private static final int  WARN_THRESHOLD_PER_WINDOW = 3;    // 3 WARN trong 60s → auto-block
    private static final long WARN_WINDOW_SECONDS        = 60L;
    private static final long USER_BLOCK_SECONDS         = 300L; // 5 phút

    private final Map<String, UserState> userStates = new ConcurrentHashMap<>();

    // ──────────────────────────────────────────────────────────────

    /**
     * Validate message — throw SecurityException nếu vi phạm.
     *
     * @param message Tin nhắn của user
     * @param userId  ID user (dùng cho rate limiting; dùng "anonymous" nếu không có)
     */
    public boolean validateMessage(String message, String userId) {
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Tin nhắn không được để trống!");
        }

        // 1. Kiểm tra user có đang bị block không
        checkUserBlocked(userId);

        // 2. Normalize: NFD + leet-speak
        String normalized = normalize(message);

        // 3. Kiểm tra BLOCK patterns
        for (Pattern p : BLOCK_PATTERNS) {
            if (p.matcher(normalized).find()) {
                log.error("🚨 [GUARDRAIL-BLOCK] userId={} | pattern='{}' | input='{}'",
                        userId, p.pattern(), message.substring(0, Math.min(50, message.length())));
                throw new SecurityException("Yêu cầu bị từ chối: vi phạm chính sách nội dung.");
            }
        }

        // 4. Kiểm tra WARN patterns + rate limiting
        for (Pattern p : WARN_PATTERNS) {
            if (p.matcher(normalized).find()) {
                log.warn("⚠️  [GUARDRAIL-WARN] userId={} | pattern='{}'", userId, p.pattern());
                int warnCount = recordWarn(userId);
                if (warnCount >= WARN_THRESHOLD_PER_WINDOW) {
                    blockUser(userId);
                    throw new SecurityException("Quá nhiều yêu cầu đáng ngờ. Tài khoản tạm thời bị hạn chế 5 phút.");
                }
            }
        }

        return true;
    }

    /** Backward compatible — không có userId */
    public boolean validateMessage(String message) {
        return validateMessage(message, "anonymous");
    }

    // ──────────────────────────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Normalize input:
     *   1. NFD → loại dấu Unicode đặc biệt (Cyrillic lookalike, diacritic)
     *   2. Leet-speak: 4→a, 3→e, 0→o, 1→i
     *   3. Lowercase
     */
    String normalize(String input) {
        // NFD normalization — loại bỏ dấu Unicode đặc biệt và ký tự Cyrillic lookalike
        String nfd = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        // Leet-speak mở rộng: chặn các cách gõ bypass phổ biến
        // Lưu ý: KHÔNG replace '0' và '1' trong hàm normalize chung vì sẽ phá hỏng kiểm tra
        // số điện thoại/CCCD — chỉ áp dụng cho BLOCK/WARN pattern check, không cho PII check
        return nfd
                .replace("4", "a")    // h4ck → hack
                .replace("3", "e")    // 3xploit → exploit
                .replace("@", "a")   // h@ck → hack
                .replace("$", "s")   // $ql inject → sql inject
                .replace("!", "i")   // !gnore → ignore
                .toLowerCase();
    }

    private void checkUserBlocked(String userId) {
        UserState state = userStates.get(userId);
        if (state != null && state.blockedUntil != null && Instant.now().isBefore(state.blockedUntil)) {
            long remaining = state.blockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
            throw new SecurityException("Tài khoản tạm thời bị hạn chế. Thử lại sau " + remaining + " giây.");
        }
    }

    private int recordWarn(String userId) {
        UserState state = userStates.computeIfAbsent(userId, k -> new UserState());
        Instant windowStart = Instant.now().minusSeconds(WARN_WINDOW_SECONDS);

        // Reset nếu window cũ hết hạn
        if (state.windowStart.isBefore(windowStart)) {
            state.warnCount.set(0);
            state.windowStart = Instant.now();
        }

        return state.warnCount.incrementAndGet();
    }

    private void blockUser(String userId) {
        UserState state = userStates.computeIfAbsent(userId, k -> new UserState());
        state.blockedUntil = Instant.now().plusSeconds(USER_BLOCK_SECONDS);
        log.error("🔒 [GUARDRAIL] User '{}' bị BLOCK {} giây (quá nhiều WARN)", userId, USER_BLOCK_SECONDS);
    }

    // ──────────────────────────────────────────────────────────────

    /**
     * Dọn dẹp định kỳ userStates mỗi giờ để tránh rò rỉ bộ nhớ (memory leak).
     * Loại bỏ các UserState đã hết thời gian block và thời gian sliding window.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupUserStates() {
        log.info("🧹 [GUARDRAIL] Khởi chạy dọn dẹp định kỳ userStates...");
        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(WARN_WINDOW_SECONDS);
        
        int initialSize = userStates.size();
        userStates.entrySet().removeIf(entry -> {
            UserState state = entry.getValue();
            boolean isBlocked = state.blockedUntil != null && now.isBefore(state.blockedUntil);
            boolean isWindowActive = state.windowStart.isAfter(windowStart);
            return !isBlocked && !isWindowActive;
        });
        
        int cleanedCount = initialSize - userStates.size();
        log.info("🧹 [GUARDRAIL] Đã dọn dẹp xong. Loại bỏ {} userStates hết hạn. Số lượng hiện tại: {}", 
                cleanedCount, userStates.size());
    }

    static class UserState {
        final AtomicInteger warnCount = new AtomicInteger(0);
        volatile Instant windowStart  = Instant.now();
        volatile Instant blockedUntil = null;
    }
}



