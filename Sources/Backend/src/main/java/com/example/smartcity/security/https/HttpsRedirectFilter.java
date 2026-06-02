package com.example.smartcity.security.https;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "security.https-redirect.enabled", havingValue = "true", matchIfMissing = false)
public class HttpsRedirectFilter extends OncePerRequestFilter {
    
    private static final Set<String> HEALTH_CHECK_PATHS = Set.of(
        "/actuator/health",
        "/actuator/info"
    );
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Allow health checks on HTTP
        if (HEALTH_CHECK_PATHS.contains(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Redirect HTTP to HTTPS (port 8080 to 8443)
        if (!request.isSecure() && request.getServerPort() == 8080) {
            String redirectUrl = buildHttpsUrl(request);
            response.setStatus(HttpServletResponse.SC_MOVED_PERMANENTLY);
            response.setHeader("Location", redirectUrl);
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");
            return;
        }
        
        // Add HSTS header for HTTPS requests
        if (request.isSecure()) {
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains");
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String buildHttpsUrl(HttpServletRequest request) {
        StringBuilder url = new StringBuilder("https://");
        url.append(request.getServerName());
        url.append(":8443");
        url.append(request.getRequestURI());
        
        String queryString = request.getQueryString();
        if (queryString != null) {
            url.append("?").append(queryString);
        }
        
        return url.toString();
    }
}
