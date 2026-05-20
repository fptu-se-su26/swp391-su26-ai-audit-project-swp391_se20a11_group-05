package com.example.smartcity.rag.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * [LAYER 8] INPUT DTO: Câu hỏi gửi lên RAG endpoint.
 * Sử dụng Java Record (immutable, thread-safe với Virtual Threads).
 *
 * POST /api/rag/query
 * {
 *   "question": "Cảm biến giao thông hoạt động thế nào?",
 *   "options": { "docType": "traffic", "language": "vi", "topK": 10 }
 * }
 */
public record RagRequest(

    @NotBlank(message = "Câu hỏi không được để trống")
    @Size(max = 2000, message = "Câu hỏi tối đa 2000 ký tự")
    String question,

    @NotNull(message = "Tùy chọn tìm kiếm là bắt buộc")
    @Valid
    RetrievalOptions options

) {}



