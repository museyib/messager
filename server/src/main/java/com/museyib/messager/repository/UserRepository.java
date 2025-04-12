package com.museyib.messager.repository;

import com.museyib.messager.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);

    Optional<AppUser> findByEmail(String email);

    @Query("SELECT DISTINCT u FROM AppUser u " +
            "JOIN Message m ON (u.username = m.sender.username AND m.receiver.username = :username) OR " +
            "(u.username = m.receiver.username AND m.sender.username = :username)")
    List<AppUser> getActiveChats(@Param("username") String username);

    Optional<AppUser> findByPhone(String phone);
}
