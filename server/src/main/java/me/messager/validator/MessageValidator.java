package me.messager.validator;

import me.messager.dto.MessageDto;

public interface MessageValidator {
    boolean validate(MessageDto message);
}
