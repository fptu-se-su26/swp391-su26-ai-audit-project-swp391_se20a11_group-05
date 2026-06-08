package com.example.smartcity.security.ratelimit;

/**
 * Ném ra khi một identifier (IP hoặc userId) vượt quá giới hạn request
 * trong khoảng thời gian cho phép.
 */
public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
