package com.recipearchive.repository;

import com.recipearchive.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // Spring Data JPA writes the SQL for you just from this method name.
    // This one query supports both the search bar AND the category filter
    // at once, since either parameter can be passed as null (see the
    // controller) and Spring will just ignore null conditions... actually
    // it won't automatically — see the note in RecipeController for how
    // we handle the "optional parameter" case simply for now.

    List<Recipe> findByTitleContainingIgnoreCaseOrIngredientsContainingIgnoreCaseOrTagsContainingIgnoreCase(
            String titleTerm, String ingredientsTerm, String tagsTerm);

    List<Recipe> findByCategory_NameIgnoreCase(String categoryName);
}
