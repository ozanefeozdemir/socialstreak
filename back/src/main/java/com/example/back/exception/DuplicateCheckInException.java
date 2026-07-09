package com.example.back.exception;

public class DuplicateCheckInException extends RuntimeException {
    public DuplicateCheckInException(String message) {
        super(message);
    }
}
