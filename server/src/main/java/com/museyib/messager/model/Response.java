package com.museyib.messager.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Response<T> {
    private int statusCode;
    private String message;
    private T data;

    public static <T> Response<T> getSuccessData(T data) {
        return Response.<T>builder()
                .statusCode(200)
                .data(data)
                .build();
    }

    public static <T> Response<T> getSuccessMessage(String message) {
        return Response.<T>builder()
                .statusCode(200)
                .message(message)
                .build();
    }

    public static <T> Response<T> getUserError(String message) {
        return Response.<T>builder()
                .statusCode(400)
                .message(message)
                .build();
    }

    public static <T> Response<T> getSystemError(String message) {
        return Response.<T>builder()
                .statusCode(500)
                .message(message)
                .build();
    }

    public static <T> Response<T> getCustomMessage(int statusCode, String message) {
        return Response.<T>builder()
                .statusCode(statusCode)
                .message(message)
                .build();
    }
}
