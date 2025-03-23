package com.museyib.messager;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MessagerApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @Order(1)
    void testCreateUser() throws Exception {
        String requestBody = """
            {
                "id": 0,
                "username": "museyib",
                "password": "Aa123456",
                "roleList": []
            }
        """;
        mockMvc.perform(post("/user/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    void testGetToken() throws Exception {
        String requestBody = """
            {
                "username": "museyib",
                "password": "Aa123456"
            }
        """;

        mockMvc.perform(post("/auth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    @Order(3)
    void testGetUsers() throws Exception {
        String response = """
                {
                  "statusCode": 0,
                  "developerMessage": null,
                  "systemMessage": null,
                  "data": {
                    "id": 1,
                    "username": "museyib",
                    "password": "$2a$10$Ohemv65VDh8vgl0TJ0qOo.h2EAVtiCtmrxTRwsQZKG0MZoGa..Sla",
                    "email": null,
                    "phone": null,
                    "roleList": [
                      "ADMIN"
                    ]
                  }
                }
                """;
        mockMvc.perform(get("/user")
                .contentType(MediaType.APPLICATION_JSON)
                        .header(AUTHORIZATION, "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtdXNleWliIiwiaWF0IjoxNzM4NDM5NTQ5LCJleHAiOjE3Mzg0NDMxNDl9.7u9-Yd3-qBbtgCqU-SGrA-ExYBG18MNT3_tLEJrYndhhhLNQrdBLG-EW907FQW8H9sQH_YQgBAHEed_cdaGkog"))
                .andExpect(status().isOk());
    }

}
