package com.recipearchive.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


// Tests only the AdminController web layer instead of starting the entire application.
@WebMvcTest(AdminController.class)

// Provides a test-specific admin password so the tests don't depend on
// the real password stored in application.properties.
@TestPropertySource(properties = "admin.password=test-password-123")
class AdminControllerTest {

    // MockMvc simulates HTTP requests to the controller without
    // needing to start a real web server.
    @Autowired
    private MockMvc mockMvc;

    // Test: correct password should be accepted with HTTP 200 (OK).
    @Test
    void validate_withCorrectPassword_returns200() throws Exception {
        mockMvc.perform(post("/api/admin/validate")
                        // Send the password in the same HTTP header
                        // that the frontend uses.
                        .header("X-Admin-Password", "test-password-123"))
                // Verify that the controller returns HTTP 200.
                .andExpect(status().isOk());
    }

    // Test: incorrect password should be rejected with HTTP 401 (Unauthorized).
    @Test
    void validate_withIncorrectPassword_returns401() throws Exception {
        mockMvc.perform(post("/api/admin/validate")
                        // Send an incorrect password.
                        .header("X-Admin-Password", "wrong-password"))
                // Verify that the controller returns HTTP 401.
                .andExpect(status().isUnauthorized());
    }

    // Test: missing password header should result in HTTP 400 (Bad Request).
    @Test
    void validate_withoutPasswordHeader_returns400() throws Exception {
        // No header at all is a malformed request — Spring rejects it
        // before it reaches our own password comparison logic.
        mockMvc.perform(post("/api/admin/validate"))
                // Verify that Spring returns HTTP 400.
                .andExpect(status().isBadRequest());
    }
}