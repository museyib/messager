package me.messager.security.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenData {
    private String token;
}
