package com.example.smartcity.common.exception;

import com.example.smartcity.common.response.ApiResponse;
import com.example.smartcity.security.ratelimit.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Object>> handleCustomException(CustomException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getStatus(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "Dữ liệu đầu vào không hợp lệ (Validation failed)", errors));
    }

    /**
     * [SECURITY] Xử lý Rate Limit — đặt TRƯỚC catch-all Exception.class
     * để Spring nhận đúng handler cụ thể hơn.
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleRateLimit(RateLimitExceededException ex) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));
        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .headers(headers)
                .body(ApiResponse.error(429, ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String rootMessage = getRootMessage(ex).toLowerCase();
        log.warn("Data integrity violation: {}", rootMessage);

        String message = "Dữ liệu đã tồn tại hoặc không hợp lệ.";
        if (rootMessage.contains("username")) {
            message = "Tên đăng nhập đã tồn tại!";
        } else if (rootMessage.contains("email")) {
            message = "Email đã được sử dụng!";
        } else if (rootMessage.contains("phone")) {
            message = "Số điện thoại này đã được liên kết với tài khoản khác!";
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Unhandled server error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "Internal Server Error. Vui lòng thử lại sau."));
    }

    private String getRootMessage(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage() != null ? root.getMessage() : ex.getMessage();
    }
}



