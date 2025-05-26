package me.messager.service;

import jakarta.transaction.Transactional;
import me.messager.dto.*;
import me.messager.model.AppUser;
import me.messager.model.Response;
import me.messager.model.UserPrivacySettings;
import me.messager.repository.UserRepository;
import me.messager.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.GONE;
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

    public Response<UserInfo> getOverview(String username) {
        try {
            AppUser appUser = userRepository.findByUsername(username).orElse(null);
            if (appUser == null) {
                return Response.getCustomMessage(NOT_FOUND.value(), "User not found.");
            }
            if (appUser.getPrivacySettings() != null && !appUser.getPrivacySettings().getShowContactInformation()) {
                return Response.getCustomMessage(GONE.value(), "User has disabled contact information.");
            }
            return Response.getSuccessData(mapToUserInfo(appUser));
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

    public AppUserDto create(RegisterRequest request) {
        AppUser user = new AppUser();
        String verificationCode = generateVerificationCode();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setVerificationCode(verificationCode);
        user.setVerificationCodeExpiryDate(LocalDateTime.now().plusSeconds(request.getVerificationTimeoutSeconds()));
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

    public Response<String> verify(VerificationRequest verificationRequest) {
        AppUser user = userRepository.findByEmail(verificationRequest.getEmail()).orElse(null);
        if (user == null) {
            return Response.getUserError("Invalid email");
        }
        if (user.getVerified()) {
            return Response.getUserError("This account is already verified.");
        }
        if (user.getVerificationCodeExpiryDate().isBefore(LocalDateTime.now())) {
            verificationRequest.setCode(generateVerificationCode());
            user.setVerificationCode(verificationRequest.getCode());
            user.setVerificationCodeExpiryDate(LocalDateTime.now().plusSeconds(verificationRequest.getTimeoutSeconds()));
            userRepository.save(user);
            mailService.sendVerificationCode(verificationRequest.getCode(), verificationRequest.getEmail());
            return Response.getCustomMessage(GONE.value(), "Verification timeout expired. New verification code was sent!");
        }
        if (!user.getVerificationCode().equals(verificationRequest.getCode())) {
            return Response.getUserError("Invalid verification code");
        }
        else {
            user.setVerificationCodeExpiryDate(null);
            user.setVerificationCode(null);
            user.setVerified(true);
            userRepository.save(user);
        }
        return Response.getSuccessMessage("User successfully verified");
    }

    public void delete(String username) {
        userRepository.findByUsername(username).ifPresent(userRepository::delete);
    }

    @Transactional
    public void updateStatus(StatusInfo statusInfo) {
        userRepository.updateStatus(statusInfo.getUsername(), statusInfo.getStatus());
    }

    private AppUserDto mapToDto(AppUser appUser) {
        AppUserDto appUserDto = AppUserDto.builder().build();
        appUserDto.setId(appUser.getId());
        appUserDto.setEmail(appUser.getEmail());
        appUserDto.setPhone(appUser.getPhone());
        appUserDto.setStatus(appUser.getStatus());
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

    private UserInfo mapToUserInfo(AppUser appUser) {
        UserInfo userInfo = new UserInfo();
        userInfo.setEmail(appUser.getEmail());
        userInfo.setPhone(appUser.getPhone());
        userInfo.setUsername(appUser.getUsername());
        return userInfo;
    }

    private String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(999999);
        return String.format("%06d", code);
    }
}
