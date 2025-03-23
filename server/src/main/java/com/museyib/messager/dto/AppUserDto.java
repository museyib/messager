package com.museyib.messager.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AppUserDto {
    private Long id;
    private String username;
    private String password;
    private String email;
    private String phone;
    private List<String> roleList;
    private Boolean verified;
}
