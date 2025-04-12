package com.museyib.messager.exception;

import com.museyib.messager.model.Response;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import static com.museyib.messager.AppUtils.getMessage;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public Response<String> handleException(final Exception exception) {
        String message = getMessage(exception);
        log.error(message, exception);
        return Response.getSystemError(message);
    }

    @ExceptionHandler(RuntimeException.class)
    public Response<String> handleException(final RuntimeException exception) {
        String message = getMessage(exception);
        log.error(message, exception);
        return Response.getUserError(message);
    }
}
