package com.recipearchive.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Lets the frontend confirm a password is correct BEFORE showing the
// admin panel, rather than only finding out when a save/delete fails.
// This is the "Submit" step on your password-gate wireframe screen.
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Value("${admin.password}")
    private String adminPassword;

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader("X-Admin-Password") String password) {
        if (password != null && adminPassword.equals(password)) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(401).body("Invalid admin password.");
    }
}
