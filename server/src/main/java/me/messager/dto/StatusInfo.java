package me.messager.dto;

import lombok.Data;

@Data
public class StatusInfo {
    private String username;
    private String status;
    private Boolean isOnline;
}
