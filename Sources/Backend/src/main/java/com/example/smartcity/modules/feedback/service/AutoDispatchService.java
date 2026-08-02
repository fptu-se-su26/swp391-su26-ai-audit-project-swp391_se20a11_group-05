package com.example.smartcity.modules.feedback.service;

import com.example.smartcity.ai_orchestrator.adapter.GeminiAdapter;
import com.example.smartcity.modules.feedback.entity.AiAnalysisLog;
import com.example.smartcity.modules.feedback.entity.AiTask;
import com.example.smartcity.modules.feedback.entity.Feedback;
import com.example.smartcity.modules.feedback.entity.FeedbackLog;
import com.example.smartcity.modules.feedback.entity.FeedbackStatus;
import com.example.smartcity.modules.feedback.repository.AiAnalysisLogRepository;
import com.example.smartcity.modules.feedback.repository.AiTaskRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackLogRepository;
import com.example.smartcity.modules.feedback.repository.FeedbackRepository;
import com.example.smartcity.modules.notification.WebSocketNotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * [ENTERPRISE FEATURE] AUTO-DISPATCH & ROUTING (Text-Only AI & Advanced Business Logic)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoDispatchService {

    private final GeminiAdapter geminiAdapter;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackLogRepository feedbackLogRepository;
    private final WebSocketNotificationService notificationService;
    private final com.example.smartcity.modules.notification.service.NotificationService citizenNotificationService;
    private final AiTaskRepository aiTaskRepository;
    private final AiAnalysisLogRepository aiAnalysisLogRepository;
    private final com.example.smartcity.modules.feedback.repository.CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private AutoDispatchService self;

    public void setSelf(AutoDispatchService self) {
        this.self = self;
    }

    private AutoDispatchService getSelf() {
        return self != null ? self : this;
    }

    @Data
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiAnalysisResult {
        @com.fasterxml.jackson.annotation.JsonProperty("is_toxic")
        private boolean is_toxic;
        private String masked_description;
        private int trust_score;
        private String reason;
        private String priority;
        private String domain;
    }

    @Transactional
    public List<AiTask> fetchAndLockTasks(int limit) {
        List<AiTask> tasks = aiTaskRepository.findPendingTasksForUpdate(limit);
        for (AiTask t : tasks) {
            t.setStatus("PROCESSING");
        }
        return aiTaskRepository.saveAll(tasks);
    }

    @Scheduled(fixedDelay = 5000)
    public void pollAndProcessTasks() {
        List<AiTask> tasks;
        try {
            tasks = self.fetchAndLockTasks(5);
        } catch (Exception e) {
            log.error("❌ [Outbox Worker] Lỗi quét và khóa tác vụ: {}", e.getMessage());
            return;
        }

        if (tasks.isEmpty()) {
            return;
        }

        log.info("[Outbox Worker] Phát hiện {} tác vụ AI cần xử lý.", tasks.size());
        for (AiTask task : tasks) {
            try {
                executeAiTask(task);
            } catch (Exception e) {
                log.error("❌ [Outbox Worker] Lỗi xử lý task id={}: {}", task.getId(), e.getMessage());
                self.handleAiFallbackAndRetry(task.getId(), task.getFeedback().getId(), e.getMessage());
            }
        }
    }

    public void executeAiTask(AiTask task) {
        Long feedbackId = task.getFeedback().getId();
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        if (feedback == null) {
            self.completeTaskWithStatus(task.getId(), "FAILED", "Không tìm thấy feedback");
            return;
        }

        log.info("🚀 [Auto-Dispatch Worker] Bắt đầu phân tích AI cho Feedback #{}", feedback.getTrackingCode());

        String systemPrompt = """
            Bạn là một Chuyên gia phân tích dữ liệu Đô thị Thông minh và Kiểm duyệt nội dung cho Chính quyền.
            Nhiệm vụ: Đánh giá độ tin cậy, kiểm duyệt ngôn từ, che giấu thông tin cá nhân và phân loại sự cố DỰA HOÀN TOÀN VÀO VĂN BẢN MÔ TẢ.
            
            ══════════════════════════════════════════════
            QUY TẮC 0 — PHÁT HIỆN AN NINH (ƯU TIÊN CAO NHẤT, KHÔNG ĐƯỢC OVERRIDE)
            ══════════════════════════════════════════════
            Nếu mô tả chứa BẤT KỲ từ/cụm từ nào trong các nhóm sau → BẮT BUỘC domain = "AN_NINH":

            NHÓM A — BẠO LỰC & HUNG KHÍ (→ priority = CRITICAL nếu đang xảy ra, HIGH nếu đã xảy ra):
            dao, mã tấu, rựa, kiếm, súng, súng tự chế, côn, gậy sắt, bình xịt, lưỡi lê, hung khí, phóng lợn,
            chém, đâm, bắn, chặt, đánh nhau, ẩu đả, hành hung, hỗn chiến, cố ý gây thương tích,
            giết người, mưu sát, máu, bị thương, băng đảng, xã hội đen, băng nhóm thanh niên,
            gây rối trật tự, cản trở công vụ, chống cảnh sát, đua xe trái phép, lạng lách đánh võng,
            say xỉn quậy phá, nhậu nhẹt hò hét đêm khuya, nẹt pô xe, quậy phá hàng xóm.

            NHÓM B — XÂM HẠI TÌNH DỤC & BẮT CÓC (→ priority = CRITICAL):
            hiếp dâm, cưỡng dâm, dâm ô, sàm sỡ, quấy rối tình dục, xâm hại, bắt cóc, bắt giữ trái pháp luật,
            giam người, bạo lực gia đình, hành hạ trẻ em, bạo hành trẻ em.

            NHÓM C — TRỘM CƯỚP & GIAN LẬN (→ priority = HIGH):
            trộm cắp, cướp, cướp giật, giật điện thoại, giật dây chuyền, móc túi, rạch túi, cẩu tặc, cạy cửa, bẻ khóa,
            đột nhập nhà dân, trộm linh kiện ô tô, trộm gương chiếu hậu, dàn cảnh va chạm giật đồ,
            đòi nợ thuê, tạt chất bẩn, tạt sơn, tạt mắm tôm, khủng bố tinh thần,
            lừa đảo, lừa đảo qua mạng, giả danh công an, giả danh tòa án, hack tài khoản,
            lạm dụng tín nhiệm, tống tiền, cưỡng đoạt, tiêu thụ tài sản gian,
            dụ dỗ học sinh, lạ mặt lảng vảng cổng trường, bảo kê bến bãi, cò mồi ép giá.

            NHÓM D — MA TÚY (→ priority = HIGH):
            ma túy, tàng trữ ma túy, vận chuyển ma túy, mua bán ma túy, sử dụng ma túy,
            bóng cười, khí N2O, cỏ Mỹ, ma túy đá, thuốc lắc, cần sa, thuốc phiện, heroin,
            ngáo đá, chứa chấp ma túy, ép buộc sử dụng ma túy, trồng cần sa, trồng thuốc phiện.

            NHÓM E — CỜ BẠC & TÍN DỤNG ĐEN (→ priority = MEDIUM):
            đánh bạc, tổ chức đánh bạc, sới bạc, gá bạc, đánh đề, lô đề, ghi số đề,
            cá độ bóng đá, game bài đổi thưởng, đá gà ăn tiền, bầu cua ăn tiền,
            cho vay nặng lãi, tín dụng đen, cầm cố trái phép, lãi suất cắt cổ, bán tài khoản ngân hàng.

            NHÓM F — AN NINH MẠNG & MẠI DÂM (→ priority = MEDIUM):
            mại dâm, bán dâm, môi giới mại dâm, tổ chức mại dâm,
            phát tán mã độc, virus máy tính, đánh cắp dữ liệu,
            kêu gọi từ thiện giả, tống tiền bằng clip, quảng cáo game bài, tín dụng đen,
            tin giả mạo, fake news, tin đồn thất thiệt, mạng xã hội gây hoang mang.

            NHÓM G — CHÁY NỔ & PCCC KHẨN CẤP (→ priority = CRITICAL):
            cháy, hỏa hoạn, cháy nhà, nổ bình gas, nổ bình xăng, chập điện gây cháy, lửa,
            sạc pin xe điện cháy, cháy chung cư, cháy karaoke, khói độc, mắc kẹt trong đám cháy.

            ══════════════════════════════════════════════
            QUY TẮC 1 — KIỂM DUYỆT NỘI DUNG
            ══════════════════════════════════════════════
            1. is_toxic: true nếu có từ chửi thề, thóa mạ, tục tĩu.
               NGOẠI LỆ: Nếu priority = CRITICAL (nguy hiểm tính mạng) → is_toxic = false để ưu tiên cứu hộ.
            2. masked_description: Che Số điện thoại (dãy 9-11 số), CCCD (dãy 12 số), biển số xe bằng "***".

            ══════════════════════════════════════════════
            QUY TẮC 2 — CHẤM ĐIỂM TIN CẬY (trust_score: 0-100)
            ══════════════════════════════════════════════
            ĐIỀU KIỆN LOẠI TỪ ĐẦU (trả về trust_score = 10 ngay, không tính tiếp):
            - Tiêu đề hoặc mô tả chứa: "test", "thử", "abc", "hello", "demo", "1234", "xin chào"
            - Mô tả dưới 4 từ và không có ngữ cảnh rõ ràng

            NGƯỢC LẠI, tính từ Điểm cơ sở: 50, áp dụng các hệ số sau:

            [ĐỊA ĐIỂM - quan trọng nhất]
            +20 → Địa chỉ đầy đủ: số nhà + tên đường + phường/xã (VD: "số 10 Lê Duẩn", "hẻm 123 đường Hoàng Diệu, phường Phước Ninh")
            +10 → Tên địa danh cụ thể nhưng không có số nhà (VD: "trước chợ Cồn", "ngã tư Nguyễn Văn Linh", "cổng trường THPT Phan Châu Trinh")
            +0  → Chỉ có "hẻm", "đầu đường", "gần nhà tôi" (quá mơ hồ)
            -15 → Không đề cập địa điểm nào cả

            [THỜI GIAN]
            +10 → Giờ cụ thể (VD: "lúc 15h", "khoảng 8 giờ sáng nay")
            +5  → Mốc tương đối (VD: "sáng nay", "chiều qua", "tối hôm qua")
            +0  → Không đề cập thời gian

            [HIỆN TRẠNG]
            +15 → Mô tả chi tiết cụ thể: kích thước, số lượng, màu sắc, mức độ (VD: "lỗ sâu 30cm, rộng 50cm", "3 xe tải đổ xà bần")
            +5  → Mô tả sự kiện rõ ràng nhưng không có số liệu cụ thể
            +0  → Mô tả chung chung không rõ hiện trạng

            [ĐỘ DÀI & CHẤT LƯỢNG]
            +10 → Trên 50 từ, mạch lạc, đầy đủ thông tin
            -15 → 5-15 từ (quá ngắn)
            -30 → Dưới 5 từ

            [NỘI DUNG KHÔNG LIÊN QUAN]
            -25 → Hỏi thủ tục hành chính, chào hỏi, quảng cáo, nội dung không phải sự cố đô thị

            Giới hạn: trust_score tối thiểu = 0, tối đa = 100.

            ══════════════════════════════════════════════
            QUY TẮC 3 — PHÂN LOẠI DOMAIN (chỉ áp dụng nếu không thuộc Rule 0)
            ══════════════════════════════════════════════
            AN_NINH (→ CÔNG AN): Xem Rule 0 ở trên.
            GIAO_THONG (→ UBND): Tai nạn giao thông, kẹt xe, ùn tắc giao thông, ổ gà, ổ voi, hố tử thần,
              sụt lún đường, xói lở, biển báo bị che khuất/mờ/gãy, đèn tín hiệu hỏng, vạch kẻ đường mờ,
              vi phạm nồng độ cồn, lái xe sau khi uống rượu bia, không đội mũ bảo hiểm,
              đi ngược chiều, vượt đèn đỏ, phóng nhanh vượt ẩu, xe quá khổ quá tải,
              xe ba gác chở tôn sắt cồng kềnh không che chắn, đón trả khách bừa bãi quốc lộ,
              rải đinh trên đường (đinh tặc), lô cốt rào chắn chiếm lòng đường.
            MOI_TRUONG (→ UBND): Xả rác/đổ xà bần trộm ra đường/kênh rạch/bãi đất trống,
              bãi rác tự phát, vứt phế thải bừa bãi, ứ đọng lâu ngày gây mất vệ sinh,
              côn trùng/ruồi muỗi bu đầy, dơ bẩn, nước rỉ rác từ xe chở rác,
              ô nhiễm không khí, ô nhiễm tiếng ồn (loa kẹo kéo, karaoke quá 22h, nhạc công suất lớn),
              khói bụi từ phương tiện cũ nát, xưởng cơ khí xả khói đen khu dân cư,
              cơ sở giặt là/rửa xe xả nước thải hóa chất, chôn lấp rác thải nguy hại,
              cây xanh sâu bệnh mục rỗng nguy cơ gãy đổ, cành cây chập điện, rễ cây nứt vỉa hè,
              đóng đinh/treo biển vào thân cây, thả chó mèo không rọ mõm phóng uế bừa bãi,
              tiểu tiện bậy góc tường/gốc cây, rải tờ rơi bừa bãi, đổ nước thải ra mặt đường,
              đốt vàng mã/rác lá cây khói bụi mù mịt lòng đường,
              chặt phá rừng (lâm tặc), khai thác cát trái phép (cát tặc), săn bắt động vật hoang dã.
            HA_TANG (→ UBND): Cây gãy/đổ, nắp cống vỡ/mất, hố ga mất nắp bẫy người,
              sụp lún đường, đứt dây điện, đèn đường hỏng/tắt tối,
              cột đèn rò rỉ điện, cột điện nghiêng, dây điện chằng chịt mạng nhện,
              hệ thống cống tắc nghẽn, nước thải trào ngược mặt đường,
              vỉa hè bong tróc vỡ nát, nhà vệ sinh công cộng hôi thối, công viên xuống cấp ghế đá gãy,
              trạm xe buýt bị đập phá, trụ nước chữa cháy hỏng/bị che khuất,
              loa phát thanh phường rè ầm ĩ, công trình công cộng xuống cấp,
              [XÂY DỰNG] xây không phép, xây sai phép, cơi nới ban công chuồng cọp lấn chiếm,
              vi phạm hành lang lưới điện/sông ngòi/lộ giới, bụi công trường không che chắn,
              xe công trình gây bùn đất vương vãi, vật liệu chắn lòng lề đường,
              công nhân không thắt dây an toàn, cần cẩu lơ lửng đầu người, đào móng gây nứt nhà liền kề,
              hố sâu không biển cảnh báo, giàn giáo đổ sập, sắt thép nhọn chĩa lối đi,
              không hoàn trả mặt đường sau đào bới, thi công gây rung ồn sau 22h,
              [PCCC VI PHẠM] dây điện cũ nát chập cháy, sạc pin xe điện qua đêm hầm chung cư,
              tích trữ xăng dầu hóa chất bình gas trái phép, thắp hương gần vật dễ cháy,
              chuồng cọp hàn kín không cửa thoát hiểm, hành lang/cầu thang chắn xe máy thùng xốp,
              cửa thoát hiểm khóa xích, xe chắn ngõ xe cứu hỏa không vào được,
              bình chữa cháy quá hạn hết áp, hệ thống báo cháy tắt, tủ PCCC chứa đồ đạc.
            Y_TE (→ UBND): Dịch bệnh, ngộ độc thực phẩm, môi trường gây bệnh, hành nghề y/dược chui,
              thẩm mỹ viện chui gây tai biến.
            KHAC: Không thuộc các nhóm trên.

            ══════════════════════════════════════════════
            QUY TẮC 4 — MỨC ĐỘ ƯU TIÊN (priority)
            ══════════════════════════════════════════════
            CRITICAL: Nguy hiểm tính mạng NGAY LẬP TỨC (cháy/hỏa hoạn, đâm chém đang diễn ra, máu, người kẹt,
              dây điện đứt hở lõi, tai nạn nặng, ngáo đá tấn công, nổ bình gas, chuồng cọp bịt kín đang cháy).
            HIGH: Bạo lực đông người / tội phạm tổ chức / nguy cơ diện rộng
              (đánh nhau nhóm, cướp giật, ma túy, băng đảng, cây đổ chắn đường chính, ngập nước lớn,
               công trình có nguy cơ đổ sập, hố ga mất nắp trên đường đông người).
            MEDIUM: Sự cố thông thường cần xử lý sớm
              (rác trộm, nắp cống vỡ, karaoke ồn ào, ổ gà nhỏ, tín dụng đen,
               xây dựng sai phép, vi phạm PCCC chưa nguy hiểm trực tiếp, vỉa hè chiếm dụng lớn).
            LOW: Góp ý cải thiện, không khẩn cấp
              (sơn lại tường, cỏ mọc dài, biển báo cũ mờ, vỉa hè nhỏ bị lấn, loa phát thanh rè).

            BẮT BUỘC trả về ĐÚNG định dạng JSON sau, không kèm bất kỳ giải thích nào khác. LƯU Ý QUAN TRỌNG: Chỉ trả về JSON thô hợp lệ. KHÔNG thêm bất kỳ văn bản nào, KHÔNG dùng emoji, KHÔNG dùng markdown ```json. Ký tự đầu tiên bắt buộc phải là '{':
            {
              "is_toxic": <true/false>,
              "masked_description": "<Đoạn text đã che PII>",
              "trust_score": <0-100>,
              "reason": "<Lý do phân loại domain và priority>",
              "priority": "<CRITICAL | HIGH | MEDIUM | LOW>",
              "domain": "<AN_NINH | GIAO_THONG | MOI_TRUONG | HA_TANG | Y_TE | KHAC>"
            }
            """;

        String userMessage = "Tiêu đề: \"" + feedback.getTitle() + "\"\n" +
                             "Mô tả sự cố: \"" + feedback.getDescription() + "\"";
        
        long startTime = System.currentTimeMillis();
        GeminiAdapter.GeminiResponse geminiResponse;
        try {
            geminiResponse = geminiAdapter.generateStructuredResponseWithUsageAsync(systemPrompt, userMessage)
                    .get(15, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch Worker] AI phân tích thất bại cho Feedback {}. Lý do: {}", feedback.getTrackingCode(), e.getMessage());
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, e.getMessage());
            return;
        }

        long latency = System.currentTimeMillis() - startTime;
        String aiRawResult = geminiResponse.getText();
        int inputTokens = geminiResponse.getInputTokens();
        int outputTokens = geminiResponse.getOutputTokens();

        log.info("🤖 [Auto-Dispatch Worker] Raw AI Output: {}", aiRawResult);

        // Guard: Nếu response không chứa '{' thì là mock fallback (Gemini bị rate limit)
        // → không parse JSON, retry luôn để tránh lỗi confusing "Unexpected character"
        if (!aiRawResult.contains("{")) {
            log.warn("⚠️ [Auto-Dispatch Worker] AI trả về mock fallback (có thể do rate limit), kích hoạt retry. Response: {}",
                    aiRawResult.substring(0, Math.min(100, aiRawResult.length())));
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, "AI mock fallback: " + aiRawResult.substring(0, Math.min(80, aiRawResult.length())));
            return;
        }

        // Clean markdown if present and extract only the JSON object
        String jsonStr = aiRawResult;
        jsonStr = jsonStr.replace("```json", "");
        jsonStr = jsonStr.replace("```", "");
        jsonStr = jsonStr.trim();

        int startIndex = jsonStr.indexOf("{");
        int endIndex = jsonStr.lastIndexOf("}");
        if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }

        try {
            AiAnalysisResult result = objectMapper.readValue(jsonStr.trim(), AiAnalysisResult.class);
            self.processAiResultAndCompleteTask(task.getId(), feedbackId, result, inputTokens, outputTokens, latency, aiRawResult);
        } catch (Exception e) {
            log.warn("⚠️ [Auto-Dispatch Worker] Parse JSON thất bại: {}", e.getMessage());
            self.handleAiFallbackAndRetry(task.getId(), feedbackId, "Parse JSON thất bại: " + e.getMessage());
        }
    }

    @Transactional
    public void processAiResultAndCompleteTask(Long taskId, Long feedbackId, AiAnalysisResult aiResult, 
                                                int inputTokens, int outputTokens, long latency, String rawResponse) {
        Feedback feedback = feedbackRepository.findByIdForUpdate(feedbackId).orElse(null);
        if (feedback == null) return;

        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask == null) return;

        FeedbackStatus oldStatus = feedback.getStatus();
        
        String safePriority = sanitizePriority(aiResult.getPriority());
        String safeDomain = sanitizeDomain(aiResult.getDomain());

        // [MODERATION] 1. Kiểm tra ngôn từ độc hại (Toxicity Filter)
        boolean isToxicReported = aiResult.is_toxic();
        boolean toxicityApplied = false;
        
        if (isToxicReported) {
            if ("CRITICAL".equals(safePriority)) {
                log.warn("⚠️ [MODERATION] Phát hiện Toxic nhưng Priority=CRITICAL -> Bỏ qua chặn, ưu tiên cứu hộ!");
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                    "🔴 [AI WARNING] Người báo cáo văng tục/xúc phạm nhưng sự cố thuộc loại KHẨN CẤP (CRITICAL). Hệ thống tự động bỏ qua kiểm duyệt để ưu tiên cứu hộ.");
                feedbackLogRepository.save(logEntry);
            } else {
                toxicityApplied = true;
                String friendlyMsg = "Phản ánh của bạn chứa ngôn từ chưa phù hợp với tiêu chuẩn cộng đồng. " +
                    "Vui lòng điều chỉnh nội dung và gửi lại. Chúng tôi luôn sẵn sàng lắng nghe!";
                feedback.setStatus(FeedbackStatus.REJECTED);
                feedback.setResolutionNote(friendlyMsg);
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                    "[AI MODERATION] Tự động khóa do phát hiện ngôn từ độc hại (Toxic=true).");
                feedbackLogRepository.save(logEntry);

                final String trackingCode = feedback.getTrackingCode();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        citizenNotificationService.createFeedbackRejectedNotification(feedbackId, friendlyMsg);
                        notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                            "🚫 Phản ánh " + trackingCode + " chưa được tiếp nhận do nội dung chưa phù hợp.");
                    }
                });
            }
        }

        if (!toxicityApplied) {
            // [MODERATION] 2. Che mờ dữ liệu cá nhân (PII Redaction)
            if (aiResult.getMasked_description() != null && !aiResult.getMasked_description().isBlank()) {
                feedback.setDescription(aiResult.getMasked_description());
            }

            log.info("📊 [Auto-Dispatch] Result parsed: Trust={}, Priority={}, Domain={}", aiResult.getTrust_score(), safePriority, safeDomain);

            // [AUTO-FIX CATEGORY] AI phát hiện chọn sai danh mục thì tự động sửa lại
            String suggestedCategoryCode = null;
            switch(safeDomain) {
                case "AN_NINH": suggestedCategoryCode = "PUBLIC_SECURITY"; break;
                case "GIAO_THONG": suggestedCategoryCode = "TRAFFIC"; break;
                case "MOI_TRUONG": suggestedCategoryCode = "ENVIRONMENT"; break;
                case "HA_TANG": suggestedCategoryCode = "URBAN_INFRASTRUCTURE"; break;
                case "XAY_DUNG": suggestedCategoryCode = "CONSTRUCTION"; break;
                case "PCCC": suggestedCategoryCode = "FIRE_SAFETY"; break;
            }
            if (suggestedCategoryCode != null && !suggestedCategoryCode.equals(feedback.getCategoryCode())) {
                String oldCategoryName = feedback.getCategoryName();
                com.example.smartcity.modules.feedback.entity.Category newCat = categoryRepository.findByCodeAndActiveTrue(suggestedCategoryCode).orElse(null);
                if (newCat != null) {
                    feedback.setCategoryCode(newCat.getCode());
                    feedback.setCategoryName(newCat.getNameVi() != null ? newCat.getNameVi() : newCat.getName());
                    
                    FeedbackLog catLog = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, oldStatus, 
                        "🔄 [AI AUTO-FIX] Đã tự động điều chỉnh danh mục từ '" + oldCategoryName + "' sang '" + feedback.getCategoryName() + "' dựa trên ngữ cảnh sự cố.");
                    feedbackLogRepository.save(catLog);
                    log.info("🔄 [Auto-Dispatch] Auto-Fixed Category from {} to {}", oldCategoryName, feedback.getCategoryName());
                }
            }

            // 3. TRUST SCORE < 40 -> SPAM/REJECT
            if (aiResult.getTrust_score() < 40) {
                String friendlyMsg = "Nội dung mô tả trong phản ánh chưa đủ rõ ràng để xác minh. " +
                    "Vui lòng bổ sung địa điểm cụ thể (số nhà, tên đường, phường/xã), mốc thời gian và mô tả hiện trạng chi tiết hơn, sau đó gửi lại.";
                feedback.setStatus(FeedbackStatus.REJECTED);
                feedback.setResolutionNote(friendlyMsg);
                feedbackRepository.save(feedback);

                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.REJECTED, 
                    "[AI AUTO-REJECT] Trust Score: " + aiResult.getTrust_score() + "% - " + aiResult.getReason());
                feedbackLogRepository.save(logEntry);

                final String trackingCode = feedback.getTrackingCode();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        citizenNotificationService.createFeedbackRejectedNotification(feedbackId, friendlyMsg);
                        notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.REJECTED.name(),
                            "🚫 Phản ánh " + trackingCode + " chưa được tiếp nhận do thiếu bằng chứng xác thực.");
                    }
                });
            } else {
                String receiverType = ("AN_NINH".equals(safeDomain) || "GIAO_THONG".equals(safeDomain)) ? "POLICE" : "WARD_STAFF";
                feedback.setPriority(safePriority);
                feedback.setReceiverType(receiverType);
                feedback.setManagedByRole(receiverType);
                feedback.setAssignedToRole(receiverType);
                if (feedback.getWard() != null) {
                    if ("POLICE".equals(receiverType)) {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward Police");
                    } else {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward People's Committee");
                    }
                }
                
                if (aiResult.getTrust_score() <= 70) {
                    feedback.setStatus(FeedbackStatus.PENDING);
                } else {
                    feedback.setStatus(FeedbackStatus.ASSIGNED);
                }
                feedbackRepository.save(feedback);

                if ("WARD_STAFF".equals(receiverType) && aiResult.getTrust_score() > 70) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            citizenNotificationService.createFeedbackAssignedToWardNotification(feedbackId);
                        }
                    });
                }

                if (aiResult.getTrust_score() <= 70) {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.PENDING, 
                        "🟡 [AI WARNING] Trust Score trung bình (" + aiResult.getTrust_score() + "%). Yêu cầu duyệt kỹ. AI phân loại: " + safePriority + " - " + safeDomain + ". Lý do: " + aiResult.getReason());
                    feedbackLogRepository.save(logEntry);
                    
                    final String trackingCode = feedback.getTrackingCode();
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            notificationService.notifyFeedbackStatusChange(feedbackId, "PENDING", 
                                "Phản ánh " + trackingCode + " đang được xem xét thêm chi tiết.");
                        }
                    });
                } else {
                    FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.ASSIGNED, 
                        "🟢 [AI CLASSIFIED] Mức độ: " + safePriority + ", Lĩnh vực: " + safeDomain + ", Uy tín: " + aiResult.getTrust_score() + "%.");
                    feedbackLogRepository.save(logEntry);
                }
            }
        }

        // Tạo log phân tích AI có cấu trúc
        AiAnalysisLog analysisLog = AiAnalysisLog.builder()
            .feedback(feedback)
            .trustScore(aiResult.getTrust_score())
            .isToxic(isToxicReported)
            .domain(safeDomain)
            .priority(safePriority)
            .reason(aiResult.getReason())
            .rawResponse(rawResponse)
            .tokensUsedInput(inputTokens)
            .tokensUsedOutput(outputTokens)
            .latencyMs(latency)
            .modelName(geminiAdapter.getProviderName())
            .build();
        aiAnalysisLogRepository.save(analysisLog);

        // Cập nhật AiTask thành COMPLETED
        aiTask.setStatus("COMPLETED");
        aiTask.setErrorMessage(null);
        aiTaskRepository.save(aiTask);
        log.info("[Outbox Worker] Đã hoàn thành AiTask id={}, feedbackId={}", taskId, feedbackId);
    }

    @Transactional
    public void handleAiFallbackAndRetry(Long taskId, Long feedbackId, String errorMessage) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElse(null);
        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask == null) return;

        int retry = aiTask.getRetryCount() + 1;
        aiTask.setRetryCount(retry);
        aiTask.setErrorMessage(errorMessage);

        if (retry >= 3) {
            aiTask.setStatus("FAILED");
            log.error("❌ [Outbox Worker] Tác vụ AI cho Feedback #{} thất bại hoàn toàn sau 3 lần thử.", feedback != null ? feedback.getTrackingCode() : feedbackId);

            if (feedback != null) {
                // [BUG FIX] Fallback: AI chưa kịp set managedByRole (vì fail trước khi phân loại xong)
                // → mặc định chuyển về WARD_STAFF để feedback không bị "mồ côi"
                if (feedback.getManagedByRole() == null || feedback.getManagedByRole().isBlank()) {
                    feedback.setManagedByRole("WARD_STAFF");
                    feedback.setReceiverType("WARD_STAFF");
                    feedback.setAssignedToRole("WARD_STAFF");
                    if (feedback.getWard() != null) {
                        feedback.setAssignedUnitName(feedback.getWard().getName() + " Ward People's Committee");
                    }
                    log.warn("⚠️ [Fallback] managedByRole chưa được set bởi AI → mặc định WARD_STAFF để tránh feedback mồ côi.");
                }

                // Luôn chuyển status về PENDING_RECEIVE để phường/cán bộ nhìn thấy và xét duyệt thủ công
                FeedbackStatus oldStatus = feedback.getStatus();
                feedback.setStatus(FeedbackStatus.PENDING_RECEIVE);
                feedbackRepository.save(feedback);

                String wardName = feedback.getWard() != null ? feedback.getWard().getName() : "địa phương";
                FeedbackLog logEntry = new FeedbackLog(feedback, feedback.getCitizen(), oldStatus, FeedbackStatus.PENDING_RECEIVE,
                    "⚠️ [Hệ thống] Hệ thống phân tích tự động hiện đang quá tải. Phản ánh đã được chuyển giao cho cán bộ Phường " + wardName + " để tiếp nhận và xử lý thủ công.");
                feedbackLogRepository.save(logEntry);

                // Notify phường (bất kể role là gì) nếu có ward → đảm bảo có người tiếp nhận
                if (feedback.getWard() != null) {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            citizenNotificationService.createFeedbackAssignedToWardNotification(feedbackId);
                            // Message hướng đến citizen — không lộ thông tin nội bộ AI
                            notificationService.notifyFeedbackStatusChange(feedbackId, FeedbackStatus.PENDING_RECEIVE.name(),
                                "📋 Phản ánh " + feedback.getTrackingCode() + " của bạn đã được tiếp nhận và đang chờ xử lý.");
                        }
                    });
                }
            }
        } else {
            aiTask.setStatus("PENDING");
            log.warn("⚠️ [Outbox Worker] Đang lên lịch thử lại tác vụ AI cho Feedback #{} (lần thử thứ {}).", feedback != null ? feedback.getTrackingCode() : feedbackId, retry);
        }
        aiTaskRepository.save(aiTask);
    }

    @Transactional
    public void completeTaskWithStatus(Long taskId, String status, String errorMessage) {
        AiTask aiTask = aiTaskRepository.findById(taskId).orElse(null);
        if (aiTask != null) {
            aiTask.setStatus(status);
            aiTask.setErrorMessage(errorMessage);
            aiTaskRepository.save(aiTask);
        }
    }

    // --- Helpers để chống ảo giác (Hallucination) từ AI ---
    private String sanitizePriority(String rawPriority) {
        if (rawPriority == null) return "MEDIUM";
        String p = rawPriority.toUpperCase().trim();
        if (p.contains("CRITICAL")) return "CRITICAL";
        if (p.contains("HIGH")) return "HIGH";
        if (p.contains("LOW")) return "LOW";
        return "MEDIUM";
    }

    private String sanitizeDomain(String rawDomain) {
        if (rawDomain == null) return "KHAC";
        String d = rawDomain.toUpperCase().trim();
        if (d.contains("AN_NINH")) return "AN_NINH";
        if (d.contains("GIAO_THONG")) return "GIAO_THONG";
        if (d.contains("MOI_TRUONG")) return "MOI_TRUONG";
        if (d.contains("HA_TANG")) return "HA_TANG";
        if (d.contains("Y_TE")) return "Y_TE";
        return "KHAC";
    }


}
