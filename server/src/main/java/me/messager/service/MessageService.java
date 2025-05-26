package me.messager.service;

import me.messager.dto.MessageDto;
import me.messager.model.Message;
import me.messager.repository.MessageRepository;
import me.messager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final DateTimeFormatter formatter;

    public void create(MessageDto messageDto) {
        Message message = new Message();
        userRepository.findByUsername(messageDto.getSender()).ifPresent(message::setSender);
        userRepository.findByUsername(messageDto.getReceiver()).ifPresent(message::setReceiver);
        message.setMessage(messageDto.getMessage());
        message.setSentAt(LocalDateTime.parse(messageDto.getSentAt()));
        message.setClientId(messageDto.getClientId());
        messageRepository.save(message);
    }

    public void edit(MessageDto messageDto) {
        Message message = messageRepository.findByClientId(messageDto.getClientId());
        message.setMessage(messageDto.getMessage());
        message.setEditedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    public void delete(Long messageId) {
        messageRepository.deleteById(messageId);
    }

    public String setDeliveredMessages(String sender, String receiver) {
        LocalDateTime now = LocalDateTime.now();
        messageRepository.setDeliveredMessages(sender, receiver, now);
        return formatter.format(now);
    }

    public MessageDto setDeliveredMessage(String clientId) {
        Message message = messageRepository.findByClientId(clientId);
        message.setDeliveredAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);
        return mapToDto(saved);
    }

    public MessageDto readMessage(String clientId) {
        Message message = messageRepository.findByClientId(clientId);
        message.setReadAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);
        return mapToDto(saved);
    }

    public void readMessages(String sender, String receiver, LocalDateTime readAt) {
        messageRepository.readMessages(sender, receiver, readAt);
    }

    public List<MessageDto> findUnreadMessagesByUsername(String username) {
        List<Message> messages = messageRepository.findUnreadMessagesByUsername(username);
        return messages.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<MessageDto> getLatestMessages(String sender, String receiver) {
        Pageable pageable = PageRequest.of(0, 50);
        List<Message> readMessages = messageRepository.getReadMessages(sender, receiver, pageable);
        List<Message> unreadMessages = messageRepository.getUnreadMessages(receiver, sender);
        List<MessageDto> messageDtoList = new java.util.ArrayList<>(unreadMessages.stream().map(this::mapToDto).toList());
        messageDtoList.addAll(readMessages.stream().map(this::mapToDto).toList());
        return messageDtoList;
    }

    public List<MessageDto> findBySenderAndReceiver(String sender, String receiver, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Message> messages = messageRepository.findConversation(sender, receiver, pageable);
        return messages.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public MessageDto findByClientId(String clientId) {
        Message message = messageRepository.findByClientId(clientId);
        return mapToDto(message);
    }

    private MessageDto mapToDto(Message message) {
        MessageDto messageDto = new MessageDto();
        messageDto.setMessageId(message.getMessageId());
        messageDto.setSender(message.getSender().getUsername());
        messageDto.setReceiver(message.getReceiver().getUsername());
        messageDto.setMessage(message.getMessage());
        messageDto.setSentAt((message.getSentAt() != null) ? formatter.format(message.getSentAt()) : null);
        messageDto.setDeliveredAt((message.getDeliveredAt() != null) ? formatter.format(message.getDeliveredAt()) : null);
        messageDto.setReadAt((message.getReadAt() != null) ? formatter.format(message.getReadAt()) : null);
        messageDto.setEditedAt((message.getEditedAt() != null) ? formatter.format(message.getEditedAt()) : null);
        messageDto.setClientId(message.getClientId());
        return messageDto;
    }
}
