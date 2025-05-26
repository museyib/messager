package me.messager.repository;

import me.messager.model.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserPrivacySettings, Long> {
}
