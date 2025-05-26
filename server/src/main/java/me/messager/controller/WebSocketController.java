package me.messager.controller;


import me.messager.dto.AppUserDto;
import me.messager.dto.MessageDto;
import me.messager.dto.StatusInfo;
import me.messager.model.ChatPair;
import me.messager.service.AppUserService;
import me.messager.service.MessageService;
import me.messager.validator.MessageValidator;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final DateTimeFormatter formatter;
    private final MessageValidator messageReceiveValidator;
    private final MessageValidator readReceiptValidator;
    private final AppUserService userService;

    public WebSocketController(SimpMessagingTemplate messagingTemplate,
                               MessageService messageService,
                               DateTimeFormatter formatter,
                               @Qualifier("messageReceiveValidator") MessageValidator messageReceiveValidator,
                               @Qualifier("readReceiptValidator") MessageValidator readReceiptValidator,
                               AppUserService userService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
        this.formatter = formatter;
        this.messageReceiveValidator = messageReceiveValidator;
        this.readReceiptValidator = readReceiptValidator;
        this.userService = userService;
    }

    @MessageMapping("/send")
    public void sendMessage(MessageDto messageDto) {
        if (messageReceiveValidator.validate(messageDto)) {
            messageService.create(messageDto);
            messagingTemplate.convertAndSendToUser(messageDto.getReceiver(), "/queue/messages", messageDto);
        }
    }

    @MessageMapping("/read")
    public void readMessages(ChatPair chatPair) {
        String sender = chatPair.getSender();
        String receiver = chatPair.getReceiver();
        List<MessageDto> messages = messageService.findUnreadMessagesByUsername(receiver);
        LocalDateTime readAt = LocalDateTime.now();
        messageService.readMessages(sender, receiver, readAt);
        for (MessageDto message : messages) {
            if (readReceiptValidator.validate(message)) {
                message.setReadAt(formatter.format(readAt));
                messagingTemplate.convertAndSendToUser(sender, "/read/messages", message);
            }
        }
    }

    @MessageMapping("/set-delivered/message")
    public void setDeliveredMessage(String clientId) {
        MessageDto deliveredMessage = messageService.setDeliveredMessage(clientId);
        String sender = deliveredMessage.getSender();
        messagingTemplate.convertAndSendToUser(sender, "/deliver/message", deliveredMessage);
    }

    @MessageMapping("/set-delivered/messages")
    public void setDeliveredMessages(ChatPair chatPair) {
        String sender = chatPair.getSender();
        String receiver = chatPair.getReceiver();
        String deliveredAt = messageService.setDeliveredMessages(sender, receiver);
        messagingTemplate.convertAndSendToUser(sender, "/deliver/messages", deliveredAt);
    }

    @MessageMapping("/read/message")
    public void readMessage(String clientId) {
        MessageDto messageDto = messageService.findByClientId(clientId);
        if (readReceiptValidator.validate(messageDto)) {
            MessageDto readMessage = messageService.readMessage(clientId);
            String sender = readMessage.getSender();
            messagingTemplate.convertAndSendToUser(sender, "/read/messages", readMessage);
        }
    }

    @MessageMapping("/send-status")
    public void sendStatus(StatusInfo statusInfo) {
        AppUserDto userDto = userService.getByUsername(statusInfo.getUsername()).getData();
        if (userDto != null) {
            if (!userDto.getShowOnlineStatus()) {
                statusInfo.setStatus(null);
                statusInfo.setIsOnline(null);
            }
            userService.updateStatus(statusInfo);
            messagingTemplate.convertAndSend("/status", statusInfo);
        }
    }
}
