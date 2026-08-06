package com.recipearchive.model;

import jakarta.persistence.*;

// @Entity tells Spring "this class represents a database table."
// By default the table name is the lowercase class name; we set it
// explicitly to match the schema we already designed (categories).
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // PK, auto-increment
    private Long id;

    @Column(nullable = false, unique = true) // UK — matches uk_categories_name
    private String name;

    // --- Constructors ---
    public Category() {
    }

    public Category(String name) {
        this.name = name;
    }

    // --- Getters & setters (JPA and Jackson/JSON both need these) ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
