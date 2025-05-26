package me.messager.dto;

import lombok.Data;

@Data
public class VerificationRequest {
    private String code;
    private String email;
    private int timeoutSeconds;
}
