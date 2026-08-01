package com.example.smartcity.modules.campaign.service;

import com.example.smartcity.modules.campaign.entity.Campaign;
import com.example.smartcity.rag.ingestion.EmbeddingClientFacade;
import com.example.smartcity.rag.model.DocumentChunk;
import com.example.smartcity.rag.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignIngestionService {

    private final EmbeddingClientFacade embeddingClientFacade;
    private final DocumentChunkRepository documentChunkRepository;

    /**
     * Đồng bộ dữ liệu chiến dịch vào Vector DB (Chạy ngầm).
     * @param campaign Chiến dịch vừa được tạo hoặc cập nhật
     */
    @Async
    public void ingestCampaignAsync(Campaign campaign) {
        if (campaign == null) {
            return;
        }

        try {
            log.info("⏳ [CampaignIngestion] Đang đồng bộ chiến dịch ID: {} vào Vector DB...", campaign.getId());

            // 1. Format nội dung
            String textContent = String.format(
                "Chiến dịch: %s\nMô tả: %s\nĐịa điểm: %s\nTrạng thái: %s\nDanh mục: %s\nThời gian bắt đầu: %s\nThời gian kết thúc: %s",
                campaign.getTitle(),
                campaign.getDescription(),
                campaign.getLocationText() != null ? campaign.getLocationText() : "Không xác định",
                campaign.getStatus(),
                campaign.getCategory(),
                campaign.getStartTime(),
                campaign.getEndTime()
            );

            // 2. Gọi Embedding API
            float[] vector = embeddingClientFacade.embed(textContent);

            // 3. Xóa Chunk cũ nếu có (Update case)
            // Lọc bằng sourceUrl (vì lưu ID campaign vào sourceUrl)
            List<DocumentChunk> existingChunks = documentChunkRepository.findAll().stream()
                .filter(chunk -> ("campaign-" + campaign.getId()).equals(chunk.getSourceUrl()))
                .toList();
            if (!existingChunks.isEmpty()) {
                documentChunkRepository.deleteAll(existingChunks);
            }

            // 4. Lưu Chunk mới vào Database
            DocumentChunk chunk = DocumentChunk.builder()
                .content(textContent)
                .embedding(vector)
                .docType("danang-campaign")
                .sourceUrl("campaign-" + campaign.getId())
                .language("vi")
                .permissionLevel(DocumentChunk.PermissionLevel.PUBLIC)
                .build();

            documentChunkRepository.save(chunk);

            log.info("✅ [CampaignIngestion] Đã đồng bộ thành công chiến dịch '{}' vào Vector DB.", campaign.getTitle());

        } catch (Exception e) {
            log.error(" [CampaignIngestion] Lỗi khi đồng bộ chiến dịch: {}", e.getMessage(), e);
        }
    }
}
