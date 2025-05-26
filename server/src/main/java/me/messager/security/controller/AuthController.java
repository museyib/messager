package me.messager.security.controller;

import me.messager.model.Response;
import me.messager.security.model.AuthRequest;
import me.messager.security.model.TokenData;
import me.messager.security.service.AuthenticationService;
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
