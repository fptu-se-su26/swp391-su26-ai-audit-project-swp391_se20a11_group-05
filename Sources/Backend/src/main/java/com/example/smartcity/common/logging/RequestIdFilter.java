package com.example.smartcity.common.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter để thêm requestId vào MDC (Mapped Diagnostic Context).
 * Mọi log trong request sẽ tự động có requestId để dễ dàng truy vết (tracing).
 */
@Component
@Slf4j
public class RequestIdFilter implements Filter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String MDC_REQUEST_ID_KEY = "requestId";
    private static final String MDC_USER_ID_KEY = "userId";
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        try {
            // Lấy requestId từ header hoặc tự tạo mới nếu không có
            String requestId = httpRequest.getHeader(REQUEST_ID_HEADER);
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString().substring(0, 8);
            }
            
            MDC.put(MDC_REQUEST_ID_KEY, requestId);
            
            // Thử lấy User ID (nếu có Auth Header, tạm thời để anonymous nếu không rõ)
            String userId = extractUserId(httpRequest);
            if (userId != null) {
                MDC.put(MDC_USER_ID_KEY, userId);
            } else {
                MDC.put(MDC_USER_ID_KEY, "anonymous");
            }
            
            log.info("🔵 [REQUEST START] {} {} | RequestID: {}", 
                httpRequest.getMethod(), 
                httpRequest.getRequestURI(),
                requestId);
            
            chain.doFilter(request, response);
            
            log.info("🟢 [REQUEST END] RequestID: {}", requestId);
            
        } finally {
            // CRITICAL: Bắt buộc phải clear MDC sau mỗi request để tránh rò rỉ bộ nhớ / lẫn lộn dữ liệu giữa các Thread
            MDC.clear();
        }
    }
    
    private String extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // Tạm thời mô phỏng lấy userId từ JWT. Có thể cắm JWT parser vào đây.
            return "jwt-user"; 
        }
        return null;
    }
}
