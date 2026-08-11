package com.recipearchive.dto;

// This is what the admin edit form (Title, URL, Ingredients, Steps, Tags,
// plus a category) will send in the request body for POST and PUT.
// We use a separate class instead of the Recipe entity directly so the
// incoming JSON is decoupled from your database structure -- e.g. it
// takes a plain categoryId instead of a nested Category object.
public class RecipeRequest {

    private String title;
    private String sourceType; // "homemade" or "external"
    private String url;
    private String notes;
    private String ingredients;
    private String steps;
    private String tags;
    private Long categoryId;

    // --- Getters & setters ---
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }
}
