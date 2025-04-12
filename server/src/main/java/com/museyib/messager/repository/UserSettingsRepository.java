package com.museyib.messager.repository;

import com.museyib.messager.model.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserPrivacySettings, Long> {
}
