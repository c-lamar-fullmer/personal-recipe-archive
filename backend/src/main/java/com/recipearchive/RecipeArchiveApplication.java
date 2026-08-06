package com.recipearchive;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// This is the file you run. It starts the embedded server (default port 8080)
// and scans everything under com.recipearchive for @RestController, @Entity, etc.
@SpringBootApplication
public class RecipeArchiveApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecipeArchiveApplication.class, args);
    }
}
