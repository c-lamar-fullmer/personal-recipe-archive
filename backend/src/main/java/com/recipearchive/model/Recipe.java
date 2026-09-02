// Tells Java this class is part of the package com.recipearchive.model
package com.recipearchive.model;

// This package gives access to @Entity, @Table, @ID, @GeneratedValue, @Column, etc.
import jakarta.persistence.*;

// @Entity tells Spring "this class represents a database table."
// By default the table name is the lowercase class name; we set it
// explicitly to match the schema we already designed (recipes).
@Entity
// This tells Spring "this class represents the table named 'recipes' in the database."
@Table(name = "recipes")
// The blueprint for a Recipe object (represents a row in the recipes table).
public class Recipe {

    @Id // PK
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incrementing ID
    private Long id; // PK column

    // FK — @ManyToOne means many recipes can point to one category.
    @ManyToOne
    // @JoinColumn is what actually creates the category_id column.
    @JoinColumn(name = "category_id", nullable = false) // FK column, cannot be null
    private Category category; // The category this recipe belongs to (FK column)

    @Column(nullable = false, unique = true) // UK — no duplicate titles
    private String title;

    @Column(name = "source_type", nullable = false) // UK — "homemade" or "external"
    private String sourceType; // "homemade" or "external"

    private String url; // nullable — only used when sourceType = "external"

    // Free-text notes, displayed just under the title (e.g. "double the
    // garlic next time", "great with rice instead of noodles")
    @Column(columnDefinition = "TEXT")
    private String notes;

    // TEXT columns for free-text search (see search endpoint below)
    @Column(columnDefinition = "TEXT")
    private String ingredients;

    @Column(columnDefinition = "TEXT")
    private String steps;

    @Column(columnDefinition = "TEXT")
    private String tags;

    // --- Constructors ---
    // Empty constructor is required by JPA (Java Persistence API) for entity classes.
    public Recipe() {
    }

    // --- Getters & setters ---
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getIngredients() {
        return ingredients;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }

    public String getSteps() {
        return steps;
    }

    public void setSteps(String steps) {
        this.steps = steps;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }
}
