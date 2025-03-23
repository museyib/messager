package com.museyib.messager.controller;


import com.museyib.messager.dto.MessageDto;
import com.museyib.messager.model.ChatPair;
import com.museyib.messager.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final DateTimeFormatter formatter;

    @MessageMapping("/send")
    public void sendMessage(MessageDto messageDto) {
        messageService.create(messageDto);
        messagingTemplate.convertAndSendToUser(messageDto.getReceiver(), "/queue/messages", messageDto);
    }

    @MessageMapping("/read")
    public void readMessages(ChatPair chatPair) {
        String sender = chatPair.getSender();
        String receiver = chatPair.getReceiver();
        List<MessageDto> messages = messageService.findUnreadMessagesByUsername(receiver);
        LocalDateTime readAt = LocalDateTime.now();
        messageService.readMessages(sender, receiver, readAt);
        for (MessageDto message : messages) {
            message.setReadAt(formatter.format(readAt));
            messagingTemplate.convertAndSendToUser(sender, "/read/messages", message);
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
        MessageDto readMessage = messageService.readMessage(clientId);
        String sender = readMessage.getSender();
        messagingTemplate.convertAndSendToUser(sender, "/read/messages", readMessage);
    }
}
