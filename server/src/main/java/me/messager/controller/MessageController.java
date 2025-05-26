package me.messager.controller;

import me.messager.dto.MessageDto;
import me.messager.model.Response;
import me.messager.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/message")
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/unread")
    public ResponseEntity<Response<List<MessageDto>>> getUnreadMessagesByUsername(@RequestParam("username") String username) {
        return ResponseEntity.ok(Response.getSuccessData(messageService.findUnreadMessagesByUsername(username)));
    }

    @GetMapping("")
    public ResponseEntity<Response<List<MessageDto>>> getAllMessagesBySenderAndReceiver(@RequestParam("sender") String sender,
                                                                                        @RequestParam("receiver") String receiver,
                                                                                        @RequestParam("page") int page,
                                                                                        @RequestParam("size") int size) {
        return ResponseEntity.ok(Response.getSuccessData(messageService.findBySenderAndReceiver(sender, receiver, page, size)));
    }

    @GetMapping("/latest")
    public ResponseEntity<Response<List<MessageDto>>> getLatestMessages(@RequestParam("sender") String sender,
                                                                        @RequestParam("receiver") String receiver) {
        return ResponseEntity.ok(Response.getSuccessData(messageService.getLatestMessages(sender, receiver)));
    }

    @PostMapping("/create")
    public ResponseEntity<Response<String>> create(@RequestBody MessageDto messageDto) {
        messageService.create(messageDto);
        return ResponseEntity.ok(Response.getSuccessData("Message created successfully"));
    }

    @PutMapping("/edit")
    public ResponseEntity<Response<String>> edit(@RequestBody MessageDto messageDto) {
        messageService.edit(messageDto);
        return ResponseEntity.ok(Response.getSuccessData("Message edited successfully"));
    }

    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<Response<String>> delete(@PathVariable("messageId") Long messageId) {
        messageService.delete(messageId);
        return ResponseEntity.ok(Response.getSuccessData("Message deleted successfully"));
    }
}
