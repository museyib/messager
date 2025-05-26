package me.messager.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String phone;
    private List<String> roleList;
    private Boolean verified;
    private Integer verificationTimeoutSeconds;
}
