package me.messager.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    static int retries = 5;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String content, String title, String recipient)
    {
        MimeMessagePreparator messagePreparator;
        try
        {
            messagePreparator = (message) -> {
                message.setRecipient(MimeMessage.RecipientType.TO, new InternetAddress(recipient));
                message.setSubject(title, "UTF-8");
                message.setFrom("museyib.e@gmail.com");
                message.setSender(new InternetAddress("museyib.e@gmail.com"));
                message.setContent(content, "text/html; charset=utf-8");
            };
            mailSender.send(messagePreparator);
        }
        catch(Exception e)
        {
            log.error(e.toString());
            if (retries-- > 0)
                sendEmail(content, title, recipient);
        }
    }

    public void sendVerificationCode(String verificationCode, String email) {
        String title = "Verify Your Account";
        String content = "Your verification code: " + verificationCode;
        sendEmail(content, title, email);
    }
}
