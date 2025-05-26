package me.messager.validator;

import lombok.RequiredArgsConstructor;
import me.messager.dto.MessageDto;
import me.messager.model.AppUser;
import me.messager.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReadReceiptValidator implements MessageValidator {
    private final UserRepository userRepository;
    public boolean validate(MessageDto message) {
        AppUser user = userRepository.findByUsername(message.getReceiver()).orElse(null);
        return user != null && user.getPrivacySettings().getShowReadReceipt();
    }
}
