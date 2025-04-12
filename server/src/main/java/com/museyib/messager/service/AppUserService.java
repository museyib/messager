package com.museyib.messager.service;

import com.museyib.messager.dto.AppUserDto;
import com.museyib.messager.model.AppUser;
import com.museyib.messager.model.Response;
import com.museyib.messager.model.UserPrivacySettings;
import com.museyib.messager.repository.UserRepository;
import com.museyib.messager.repository.UserSettingsRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppUserService {
    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    public Response<List<AppUserDto>> getUsers() {
        try {
            List<AppUser> users = userRepository.findAll();
            return Response.getSuccessData(users.stream().map(this::mapToDto).toList());
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<List<AppUserDto>> getActiveChats(String username) {
        try {
            List<AppUser> users = userRepository.getActiveChats(username);
            return Response.getSuccessData(users.stream().map(this::mapToDto).toList());
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<AppUserDto> getByUsername(String username) {
        try {
            AppUser appUser = userRepository.findByUsername(username).orElse(null);
            if (appUser == null) {
                return Response.getCustomMessage(NOT_FOUND.value(), "User not found.");
            }
            return Response.getSuccessData(mapToDto(appUser));
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<Boolean> checkByUsername(String username) {
        try {
            AppUser appUser = userRepository.findByUsername(username).orElse(null);
            Response<Boolean> response;
            String message = null;
            boolean data = false;
            if (appUser != null) {
                data = true;
                message = "Username is already in use: " + username;
            }

            response = Response.getSuccessData(data);
            response.setMessage(message);

            return response;
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<AppUserDto> getByEmail(String email) {
        try {
            AppUser appUser = userRepository.findByEmail(email).orElse(null);
            if (appUser == null) {
                return Response.getCustomMessage(NOT_FOUND.value(), "User not found.");
            }
            return Response.getSuccessData(mapToDto(appUser));
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<Boolean> checkByEmail(String email) {
        try {
            AppUser appUser = userRepository.findByEmail(email).orElse(null);
            Response<Boolean> response;
            String message = null;
            boolean data = false;
            if (appUser != null) {
                data = true;
                message = "Email is already in use: " + email;
            }

            response = Response.getSuccessData(data);
            response.setMessage(message);

            return response;
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<AppUserDto> getByPhone(String phone) {
        try {
            AppUser appUser = userRepository.findByPhone(phone).orElse(null);
            if (appUser == null) {
                return Response.getCustomMessage(NOT_FOUND.value(), "User not found.");
            }
            return Response.getSuccessData(mapToDto(appUser));
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<Boolean> checkByPhone(String phone) {
        try {
            AppUser appUser = userRepository.findByPhone(phone).orElse(null);
            Response<Boolean> response;
            String message = null;
            boolean data = false;
            if (appUser != null) {
                data = true;
                message = "Phone number is already in use: " + phone;
            }

            response = Response.getSuccessData(data);
            response.setMessage(message);

            return response;
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public AppUserDto create(AppUserDto userDto) {
        AppUser user = new AppUser();
        String verificationCode = generateVerificationCode();
        user.setUsername(userDto.getUsername());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiryDate(LocalDateTime.now().plusMinutes(15));
        user.setPrivacySettings(new UserPrivacySettings());
        AppUser savedUser = userRepository.save(user);
        mailService.sendVerificationCode(verificationCode, savedUser.getEmail());
        return mapToDto(savedUser);
    }

    public Response<AppUserDto> update(AppUserDto userDto) {
        try {
            AppUser user = userRepository.findById(userDto.getId()).orElseThrow();
            user.setUsername(userDto.getUsername());
            user.setEmail(userDto.getEmail());
            user.setPhone(userDto.getPhone());
            UserPrivacySettings privacySettings = user.getPrivacySettings();
            if (privacySettings == null) {
                privacySettings = new UserPrivacySettings();
                user.setPrivacySettings(privacySettings);
            }
            privacySettings.setAllowReceiveMessage(userDto.getAllowReceiveMessage());
            privacySettings.setShowContactInformation(userDto.getShowContactInformation());
            privacySettings.setShowOnlineStatus(userDto.getShowOnlineStatus());
            privacySettings.setShowReadReceipt(userDto.getShowReadReceipt());
            AppUser savedUser = userRepository.save(user);
            return Response.getSuccessData(mapToDto(savedUser));
        }
        catch (Exception e) {
            log.error(e.toString());
            return Response.getSystemError(e.getMessage());
        }
    }

    public Response<String> verify(String verificationCode, String email) {
        AppUser user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return Response.getUserError("Invalid email");
        }
        if (user.getVerified()) {
            return Response.getUserError("This account is already verified.");
        }
        if (!user.getVerificationCode().equals(verificationCode)) {
            return Response.getUserError("Invalid verification code");
        }
        else {
            if (user.getVerificationCodeExpiryDate().isBefore(LocalDateTime.now())) {
                return Response.getUserError("Expired verification code");
            }
            else {
                user.setVerificationCodeExpiryDate(null);
                user.setVerificationCode(null);
                user.setVerified(true);
                userRepository.save(user);
            }
        }
        return Response.getSuccessMessage("User successfully verified");
    }

    public void delete(String username) {
        userRepository.findByUsername(username).ifPresent(userRepository::delete);
    }

    private AppUserDto mapToDto(AppUser appUser) {
        AppUserDto appUserDto = AppUserDto.builder().build();
        appUserDto.setId(appUser.getId());
        appUserDto.setEmail(appUser.getEmail());
        appUserDto.setPhone(appUser.getPhone());
        appUserDto.setUsername(appUser.getUsername());
        appUserDto.setVerified(appUser.getVerified());
        UserPrivacySettings privacySettings = appUser.getPrivacySettings();
        if (privacySettings != null) {
            appUserDto.setAllowReceiveMessage(appUser.getPrivacySettings().getAllowReceiveMessage());
            appUserDto.setShowContactInformation(appUser.getPrivacySettings().getShowContactInformation());
            appUserDto.setShowReadReceipt(appUser.getPrivacySettings().getShowReadReceipt());
            appUserDto.setShowOnlineStatus(appUser.getPrivacySettings().getShowOnlineStatus());
        }
        return appUserDto;
    }

    private String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(999999);
        return String.format("%06d", code);
    }
}
