package com.recipearchive.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@TestPropertySource(properties = "admin.password=test-password-123")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void validate_withCorrectPassword_returns200() throws Exception {
        mockMvc.perform(post("/api/admin/validate")
                        .header("X-Admin-Password", "test-password-123"))
                .andExpect(status().isOk());
    }

    @Test
    void validate_withIncorrectPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/admin/validate")
                        .header("X-Admin-Password", "wrong-password"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validate_withoutPasswordHeader_returns400() throws Exception {
        // No header at all is a malformed request — Spring rejects it
        // before it ever reaches our own password comparison logic.
        mockMvc.perform(post("/api/admin/validate"))
                .andExpect(status().isBadRequest());
    }
}
