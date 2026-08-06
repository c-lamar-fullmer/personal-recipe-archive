package com.recipearchive.controller;

import com.recipearchive.dto.RecipeRequest;
import com.recipearchive.model.Category;
import com.recipearchive.model.Recipe;
import com.recipearchive.repository.CategoryRepository;
import com.recipearchive.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired
    private RecipeRepository recipeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    // Reads from application.properties (admin.password=...) instead of
    // being hardcoded directly in the source file, so it's not sitting in
    // plain sight if you ever push this to GitHub.
    @Value("${admin.password}")
    private String adminPassword;

    private boolean isAuthorized(String providedPassword) {
        return providedPassword != null && adminPassword.equals(providedPassword);
    }

    // ------------------- READ (already working) -------------------

    @GetMapping
    public List<Recipe> getRecipes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {

        if (search != null && !search.isBlank()) {
            return recipeRepository
                    .findByTitleContainingIgnoreCaseOrIngredientsContainingIgnoreCaseOrTagsContainingIgnoreCase(
                            search, search, search);
        }

        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            return recipeRepository.findByCategory_NameIgnoreCase(category);
        }

        return recipeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipeById(@PathVariable Long id) {
        return recipeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ------------------- CREATE -------------------

    @PostMapping
    public ResponseEntity<?> createRecipe(
            @RequestHeader("X-Admin-Password") String password,
            @RequestBody RecipeRequest request) {

        if (!isAuthorized(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid admin password.");
        }

        Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Category not found for id " + request.getCategoryId());
        }

        Recipe recipe = new Recipe();
        recipe.setTitle(request.getTitle());
        recipe.setCategory(categoryOpt.get());
        recipe.setSourceType(request.getSourceType());
        recipe.setUrl(request.getUrl());
        recipe.setIngredients(request.getIngredients());
        recipe.setSteps(request.getSteps());
        recipe.setTags(request.getTags());

        try {
            Recipe saved = recipeRepository.save(recipe);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (DataIntegrityViolationException e) {
            // Triggered by the unique constraint on title
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A recipe with that title already exists.");
        }
    }

    // ------------------- UPDATE -------------------

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRecipe(
            @PathVariable Long id,
            @RequestHeader("X-Admin-Password") String password,
            @RequestBody RecipeRequest request) {

        if (!isAuthorized(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid admin password.");
        }

        Optional<Recipe> existingOpt = recipeRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Category not found for id " + request.getCategoryId());
        }

        Recipe recipe = existingOpt.get();
        recipe.setTitle(request.getTitle());
        recipe.setCategory(categoryOpt.get());
        recipe.setSourceType(request.getSourceType());
        recipe.setUrl(request.getUrl());
        recipe.setIngredients(request.getIngredients());
        recipe.setSteps(request.getSteps());
        recipe.setTags(request.getTags());

        try {
            Recipe saved = recipeRepository.save(recipe);
            return ResponseEntity.ok(saved);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A recipe with that title already exists.");
        }
    }

    // ------------------- DELETE -------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRecipe(
            @PathVariable Long id,
            @RequestHeader("X-Admin-Password") String password) {

        if (!isAuthorized(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid admin password.");
        }

        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        recipeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
