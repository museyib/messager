package com.museyib.messager.security.controller;

import com.museyib.messager.model.Response;
import com.museyib.messager.security.model.AuthRequest;
import com.museyib.messager.security.model.TokenData;
import com.museyib.messager.security.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import static org.apache.http.HttpStatus.SC_BAD_REQUEST;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationService authenticationService;

    @PostMapping("/token")
    public ResponseEntity<Response<TokenData>> authenticate(@RequestBody AuthRequest authRequest) {
        try {
            return ResponseEntity.ok(Response.getSuccessData(authenticationService.getTokenData(authRequest)));
        }
        catch (AuthenticationException e) {
            return ResponseEntity.status(SC_BAD_REQUEST).body(Response.getUserError(e.getMessage()));
        }
    }
}
