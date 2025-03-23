package com.museyib.messager.controller;

import com.museyib.messager.dto.AppUserDto;
import com.museyib.messager.model.Response;
import com.museyib.messager.service.AppUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.apache.http.HttpStatus.SC_OK;
import static org.apache.http.HttpStatus.SC_UNPROCESSABLE_ENTITY;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final AppUserService userService;

    @GetMapping
    public ResponseEntity<Response<List<AppUserDto>>> getAll() {
        return ResponseEntity.ok(Response.getSuccessData(userService.getUsers()));
    }

    @GetMapping("/active-chats")
    public ResponseEntity<Response<List<AppUserDto>>> getActiveChats(@RequestParam("username") String username) {
        return ResponseEntity.ok(Response.getSuccessData(userService.getActiveChats(username)));
    }

    @GetMapping("/{username}")
    public ResponseEntity<Response<AppUserDto>> getByUsername(@PathVariable("username") String username) {
        AppUserDto user = userService.getByUsername(username);
        return ResponseEntity.ok(Response.getSuccessData(user));
    }

    @GetMapping("/check/by-username/{username}")
    public ResponseEntity<Response<String>> checkByUsername(@PathVariable("username") String username) {
        AppUserDto user = userService.getByUsername(username);
        int statusCode;
        String message = null;
        if (user == null) {
            statusCode = SC_OK;
        }
        else {
            statusCode = SC_UNPROCESSABLE_ENTITY;
            message = "Username is already in use: " + username;
        }
        return ResponseEntity.status(statusCode).body(Response.getCustomMessage(statusCode, message));
    }

    @GetMapping("/check/by-email/{email}")
    public ResponseEntity<Response<Boolean>> checkByEmail(@PathVariable("email") String email) {
        AppUserDto user = userService.getByEmail(email);
        int statusCode;
        String message = null;
        if (user == null) {
            statusCode = SC_OK;
        }
        else {
            statusCode = SC_UNPROCESSABLE_ENTITY;
            message = "Email is already in use: " + email;
        }
        return ResponseEntity.status(statusCode).body(Response.getCustomMessage(statusCode, message));
    }

    @GetMapping("/check/by-phone/{phone}")
    public ResponseEntity<Response<Boolean>> checkByPhone(@PathVariable("phone") String phone) {
        AppUserDto user = userService.getByPhone(phone);
        int statusCode;
        String message = null;
        if (user == null) {
            statusCode = SC_OK;
        }
        else {
            statusCode = SC_UNPROCESSABLE_ENTITY;
            message = "Phone is already in use: " + phone;
        }
        return ResponseEntity.status(statusCode).body(Response.getCustomMessage(statusCode, message));
    }

    @PostMapping("/verify")
    public ResponseEntity<Response<String>> verify(@RequestParam("code") String code,
                                         @RequestParam("email") String email) {
        Response<String> response = userService.verify(code, email);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    @GetMapping("/by-phone")
    public ResponseEntity<Response<AppUserDto>> getByPhone(@RequestParam("phone") String phone) {
        AppUserDto userDto = userService.getByPhone(phone);
        return ResponseEntity.ok(Response.getSuccessData(userDto));
    }

    @PostMapping("/create")
    public ResponseEntity<Response<AppUserDto>> create(@RequestBody AppUserDto user) {
        return ResponseEntity.ok(Response.getSuccessData(userService.create(user)));
    }

    @PutMapping("/update")
    public ResponseEntity<Response<AppUserDto>> update(@RequestBody AppUserDto user) {
        return ResponseEntity.ok(Response.getSuccessData(userService.update(user)));
    }

    @DeleteMapping("/delete/{username}")
    public ResponseEntity<Response<Boolean>> delete(@PathVariable("username") String username) {
        userService.delete(username);
        return ResponseEntity.ok(Response.getSuccessData(true));
    }
}
