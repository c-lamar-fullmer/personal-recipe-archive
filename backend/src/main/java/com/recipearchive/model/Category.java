// Tells Java this class is part of the package com.recipearchive.model
package com.recipearchive.model;

// This package gives access to @Entity, @Table, @ID, @GeneratedValue, @Column, etc.
import jakarta.persistence.*;

// @Entity tells Spring "this class represents a database table."
// By default the table name is the lowercase class name; we set it
// explicitly to match the schema we already designed (categories).
@Entity
// This tells Spring "this class represents the table named 'categories' in the database."
@Table(name = "categories")
// The blueprint for a Category object (represents a row in the categories table).
public class Category {

    @Id // PK
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incrementing ID
    private Long id; // PK column

    @Column(nullable = false, unique = true) // UK — matches uk_categories_name
    private String name; // Column for the category name

    // --- Constructors ---
    // Empty constructor is required by JPA (Java Persistence API) for entity classes.
    public Category() {
    }
    // Constructor to create a Category with a name (used when creating new categories).
    public Category(String name) {
        this.name = name; // Set the name of the category
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
