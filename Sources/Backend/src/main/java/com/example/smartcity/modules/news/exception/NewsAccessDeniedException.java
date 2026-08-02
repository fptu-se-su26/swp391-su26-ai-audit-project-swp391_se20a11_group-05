package com.example.smartcity.modules.news.exception;

import com.example.smartcity.common.exception.CustomException;

public class NewsAccessDeniedException extends CustomException {
    public NewsAccessDeniedException(String message) {
        super(message, 403);
    }
}
