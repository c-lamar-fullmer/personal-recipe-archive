package com.recipearchive.repository;

import com.recipearchive.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // Searches across title, ingredients, steps, AND tags now — a match
    // in any one of those four fields includes the recipe in the results.
    List<Recipe> findByTitleContainingIgnoreCaseOrIngredientsContainingIgnoreCaseOrStepsContainingIgnoreCaseOrTagsContainingIgnoreCase(
            String titleTerm, String ingredientsTerm, String stepsTerm, String tagsTerm);

    List<Recipe> findByCategory_NameIgnoreCase(String categoryName);
}
