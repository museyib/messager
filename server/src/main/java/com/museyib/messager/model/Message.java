package com.museyib.messager.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @Column
    private String message;

    @ManyToOne
    private AppUser sender;

    @ManyToOne
    private AppUser receiver;

    @Column
    private LocalDateTime sentAt;

    @Column
    private LocalDateTime editedAt;

    @Column
    private LocalDateTime deliveredAt;

    @Column
    private LocalDateTime readAt;

    @Column
    private String clientId;
}
