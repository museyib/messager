package com.museyib.messager.dto;

import lombok.Data;

@Data
public class MessageDto {
    private Long messageId;
    private String message;
    private String sender;
    private String receiver;
    private String sentAt;
    private String deliveredAt;
    private String readAt;
    private String editedAt;
    private String clientId;
}
