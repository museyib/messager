package com.museyib.messager.service;

import com.museyib.messager.dto.AppUserDto;
import com.museyib.messager.model.AppUser;
import com.museyib.messager.model.Response;
import com.museyib.messager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    public List<AppUserDto> getUsers() {
        List<AppUser> users = userRepository.findAll();
        return users.stream().map(this::mapToDto).toList();
    }

    public List<AppUserDto> getActiveChats(String username) {
        List<AppUser> users = userRepository.getActiveChats(username);
        return users.stream().map(this::mapToDto).toList();
    }

    public AppUserDto getByUsername(String username) {
        AppUser appUser = userRepository.findByUsername(username).orElse(null);
        if (appUser == null) {
            return null;
        }
        return mapToDto(appUser);
    }

    public AppUserDto getByEmail(String email) {
        AppUser appUser = userRepository.findByEmail(email);
        if (appUser == null) {
            return null;
        }
        return mapToDto(appUser);
    }

    public AppUserDto getByPhone(String phone) {
        AppUser appUser = userRepository.findByPhone(phone);
        if (appUser == null) {
            return null;
        }
        return mapToDto(appUser);
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
        AppUser savedUser = userRepository.save(user);
        mailService.sendVerificationCode(verificationCode, savedUser.getEmail());
        return mapToDto(savedUser);
    }

    public AppUserDto update(AppUserDto userDto) {
        AppUser user = userRepository.findById(userDto.getId()).orElse(null);
        if (user == null) {
            return null;
        }
        user.setUsername(userDto.getUsername());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        user.setVerified(userDto.getVerified());
        AppUser savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    public Response<String> verify(String verificationCode, String email) {
        AppUser user = userRepository.findByEmail(email);
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
        appUserDto.setEmail(appUser.getEmail());
        appUserDto.setPhone(appUser.getPhone());
        appUserDto.setUsername(appUser.getUsername());
        appUserDto.setVerified(appUser.getVerified());
        return appUserDto;
    }

    private String generateVerificationCode() {
        SecureRandom random = new SecureRandom();
        int code = random.nextInt(999999);
        return String.format("%06d", code);
    }
}
