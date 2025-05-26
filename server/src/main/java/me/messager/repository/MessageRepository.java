package me.messager.repository;

import me.messager.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m " +
            "WHERE m.receiver.username = :username AND m.readAt IS NULL " +
            "ORDER BY m.sentAt DESC")
    List<Message> findUnreadMessagesByUsername(@Param("username") String username);


    @Query("SELECT m FROM Message m " +
            "WHERE m.sender.username = :sender " +
            "AND m.receiver.username = :receiver AND m.readAt IS NULL " +
            "ORDER BY m.sentAt DESC")
    List<Message> getUnreadMessages(@Param("sender") String sender, @Param("receiver") String receiver);

    @Query("SELECT m FROM Message m " +
            "WHERE (m.sender.username = :user1 AND m.receiver.username = :user2) " +
            "   OR (m.sender.username = :user2 AND m.receiver.username = :user1) " +
            "ORDER BY m.sentAt DESC")
    List<Message> findConversation(@Param("user1") String user1, @Param("user2") String user2, Pageable pageable);

    @Query("SELECT m FROM Message m " +
            "WHERE ((m.sender.username = :user1 AND m.receiver.username = :user2) " +
            "   OR (m.sender.username = :user2 AND m.receiver.username = :user1) " +
            "       AND m.readAt is not null) " +
            "ORDER BY m.sentAt DESC")
    List<Message> getReadMessages(@Param("user1") String user1, @Param("user2") String user2, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Message SET deliveredAt = :deliveredAt " +
            "WHERE sender.username = :sender " +
            "  AND receiver.username = :receiver AND deliveredAt IS NULL")
    void setDeliveredMessages(@Param("sender") String sender, @Param("receiver") String receiver, @Param("deliveredAt") LocalDateTime deliveredAt);

    @Modifying
    @Transactional
    @Query("UPDATE Message SET readAt = :readAt " +
            "WHERE sender.username = :sender " +
            "  AND receiver.username = :receiver AND readAt IS NULL")
    void readMessages(@Param("sender") String sender, @Param("receiver") String receiver, @Param("readAt") LocalDateTime readAt);

    Message findByClientId(String clientId);
}
