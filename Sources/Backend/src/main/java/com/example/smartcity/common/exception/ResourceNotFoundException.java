package com.example.smartcity.common.exception;

public class ResourceNotFoundException extends CustomException {
    public ResourceNotFoundException(String resourceName, Object id) {
        super(String.format("%s với ID '%s' không tồn tại", resourceName, id), 404);
    }
    
    public ResourceNotFoundException(String message) {
        super(message, 404);
    }
}
