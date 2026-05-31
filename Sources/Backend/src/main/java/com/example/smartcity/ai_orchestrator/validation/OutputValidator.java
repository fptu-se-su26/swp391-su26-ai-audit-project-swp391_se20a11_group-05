package com.example.smartcity.ai_orchestrator.validation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * [ZOD-LIKE VALIDATOR]
 * Bộ kiểm tra Schema cho kết quả của LLM.
 * Sử dụng sức mạnh của Jackson (Ép kiểu) và Jakarta Validation (Check rules).
 */
@Component
public class OutputValidator {

    private static final Logger log = LoggerFactory.getLogger(OutputValidator.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator;
    
    public OutputValidator(Validator validator) {
        this.validator = validator;
    }

    /**
     * Parse JSON (sử dụng Class)
     */
    public <T> T validateAndParse(String json, Class<T> targetClass) {
        String cleanJson = extractJson(json);
        try {
            T parsedObject = objectMapper.readValue(cleanJson, targetClass);
            performValidation(parsedObject);
            log.debug("✅ [Zod Validator] LLM trả về JSON hợp lệ cho class {}", targetClass.getSimpleName());
            return parsedObject;
        } catch (JsonProcessingException e) {
            log.warn("⚠️ [Zod Validator] Lỗi cú pháp JSON: {}", e.getMessage());
            throw new AiValidationException("Chuỗi trả về không phải là JSON hợp lệ: " + e.getOriginalMessage(), e);
        }
    }

    /**
     * Parse JSON (sử dụng TypeReference - Hỗ trợ Nested Generics như List<T>)
     */
    public <T> T validateAndParse(String json, com.fasterxml.jackson.core.type.TypeReference<T> typeReference) {
        String cleanJson = extractJson(json);
        try {
            T parsedObject = objectMapper.readValue(cleanJson, typeReference);
            performValidation(parsedObject);
            log.debug("✅ [Zod Validator] LLM trả về JSON hợp lệ cho kiểu {}", typeReference.getType().getTypeName());
            return parsedObject;
        } catch (JsonProcessingException e) {
            log.warn("⚠️ [Zod Validator] Lỗi cú pháp JSON: {}", e.getMessage());
            throw new AiValidationException("Chuỗi trả về không phải là JSON hợp lệ: " + e.getOriginalMessage(), e);
        }
    }

    /**
     * Hàm nội bộ để chạy validation. Tự động quét Iterable nếu JSON là một Mảng.
     */
    private <T> void performValidation(T parsedObject) {
        if (parsedObject == null) {
            throw new AiValidationException("Dữ liệu parse ra bị null");
        }
        
        if (parsedObject instanceof Iterable<?> iterable) {
            int index = 0;
            for (Object item : iterable) {
                if (item != null) {
                    validateSingleObject(item, "Phần tử thứ " + index + ": ");
                }
                index++;
            }
        } else {
            validateSingleObject(parsedObject, "");
        }
    }

    private void validateSingleObject(Object obj, String errorPrefix) {
        Set<ConstraintViolation<Object>> violations = validator.validate(obj);
        if (!violations.isEmpty()) {
            String errorMsg = violations.stream()
                    .map(v -> String.format("%sTrường '%s' %s", errorPrefix, v.getPropertyPath(), v.getMessage()))
                    .collect(Collectors.joining("; "));
            
            log.warn("⚠️ [Zod Validator] Lỗi Schema: {}", errorMsg);
            throw new AiValidationException("JSON thiếu hoặc sai rule: " + errorMsg);
        }
    }

    /**
     * Xử lý trường hợp LLM bọc JSON trong Markdown ```json ... ```
     */
    private String extractJson(String rawText) {
        if (rawText == null) return "{}";
        String text = rawText.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        return text.trim();
    }
}
