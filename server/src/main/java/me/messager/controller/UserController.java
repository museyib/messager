package me.messager.controller;

import me.messager.dto.AppUserDto;
import me.messager.dto.RegisterRequest;
import me.messager.dto.UserInfo;
import me.messager.dto.VerificationRequest;
import me.messager.model.Response;
import me.messager.service.AppUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final AppUserService userService;

    @GetMapping("/admin/users")
    public ResponseEntity<Response<List<AppUserDto>>> getAll() {
        Response<List<AppUserDto>> response = userService.getUsers();
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/active-chats")
    public ResponseEntity<Response<List<AppUserDto>>> getActiveChats(@RequestParam("username") String username) {
        Response<List<AppUserDto>> response = userService.getActiveChats(username);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/by-username")
    public ResponseEntity<Response<AppUserDto>> getByUsername(@RequestParam("username") String username) {
        Response<AppUserDto> response = userService.getByUsername(username);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/overview")
    public ResponseEntity<Response<UserInfo>> getOverview(@RequestParam("username") String username) {
        Response<UserInfo> response = userService.getOverview(username);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/check/by-username/{username}")
    public ResponseEntity<Response<Boolean>> checkByUsername(@PathVariable("username") String username) {
        Response<Boolean> response = userService.checkByUsername(username);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/check/by-email/{email}")
    public ResponseEntity<Response<Boolean>> checkByEmail(@PathVariable("email") String email) {
        Response<Boolean> response = userService.checkByEmail(email);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/check/by-phone/{phone}")
    public ResponseEntity<Response<Boolean>> checkByPhone(@PathVariable("phone") String phone) {
        Response<Boolean> response = userService.checkByPhone(phone);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Response<String>> verify(@RequestBody VerificationRequest verificationRequest) {
        Response<String> response = userService.verify(verificationRequest);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/by-phone")
    public ResponseEntity<Response<AppUserDto>> getByPhone(@RequestParam("phone") String phone) {
        Response<AppUserDto> response = userService.getByPhone(phone);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @PostMapping("/create")
    public ResponseEntity<Response<AppUserDto>> create(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(Response.getSuccessData(userService.create(request)));
    }

    @PatchMapping("/update")
    public ResponseEntity<Response<AppUserDto>> update(@RequestBody AppUserDto user) {
        Response<AppUserDto> response = userService.update(user);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @DeleteMapping("/delete/{username}")
    public ResponseEntity<Response<Boolean>> delete(@PathVariable("username") String username) {
        userService.delete(username);
        return ResponseEntity.ok(Response.getSuccessData(true));
    }
}
