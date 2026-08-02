package com.example.smartcity.modules.news.exception;

import com.example.smartcity.common.exception.CustomException;

public class InvalidNewsCategoryException extends CustomException {
    public InvalidNewsCategoryException(String message) {
        super(message, 400);
    }
}
