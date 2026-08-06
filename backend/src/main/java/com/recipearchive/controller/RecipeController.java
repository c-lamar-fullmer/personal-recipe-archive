package com.recipearchive.controller;

import com.recipearchive.model.Recipe;
import com.recipearchive.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @CrossOrigin("*") is here so your frontend (opened via Live Server on a
// different port, e.g. 5500) is allowed to fetch() this API during
// development. Tighten this before any real deployment.
@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired
    private RecipeRepository recipeRepository;

    // Handles BOTH dynamic interactions required by your Phase 1 plan:
    //   GET /api/recipes                     -> everything
    //   GET /api/recipes?search=garlic        -> title/ingredients/tags match
    //   GET /api/recipes?category=Dessert     -> exact category match
    //
    // NOTE: this is a simple first version — it doesn't yet combine search
    // AND category in the same request. That's a good next refinement once
    // this is working (it would use a custom @Query instead of the two
    // derived methods below).
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

    // GET /api/recipes/{id} -> powers the detail view (tapping a recipe card)
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipeById(@PathVariable Long id) {
        return recipeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
