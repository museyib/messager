package me.messager.dto;

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
    private String status;
    private List<String> roleList;
    private Boolean verified;
    private Boolean allowReceiveMessage;
    private Boolean showContactInformation;
    private Boolean showReadReceipt;
    private Boolean showOnlineStatus;
}
