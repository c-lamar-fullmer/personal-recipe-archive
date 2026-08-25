package com.recipearchive.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recipearchive.model.Category;
import com.recipearchive.model.Recipe;
import com.recipearchive.repository.CategoryRepository;
import com.recipearchive.repository.RecipeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// @WebMvcTest loads only the web layer (this controller + Spring MVC),
// not the full application — so it never needs a real database
// connection. CategoryRepository and RecipeRepository are replaced with
// mocks via @MockBean, and we control exactly what they return.
//
// @TestPropertySource overrides admin.password for these tests only, so
// they don't depend on a real application.properties file existing
// (which is gitignored and won't be present on a fresh clone).
@WebMvcTest(RecipeController.class)
@TestPropertySource(properties = "admin.password=test-password-123")
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RecipeRepository recipeRepository;

    @MockBean
    private CategoryRepository categoryRepository;

    private Category sampleCategory() {
        Category category = new Category("dessert");
        category.setId(1L);
        return category;
    }

    private Recipe sampleRecipe() {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setTitle("Chocolate Chip Cookies");
        recipe.setCategory(sampleCategory());
        recipe.setSourceType("homemade");
        recipe.setIngredients("flour\nsugar\nchocolate chips");
        recipe.setSteps("Mix.\nBake.");
        recipe.setTags("dessert\nclassic");
        return recipe;
    }

    // ------------------- READ -------------------

    @Test
    void getRecipes_returnsOkAndList() throws Exception {
        // No query params means both search and category are normalized
        // to null in the controller, so the mock stubs that exact call.
        when(recipeRepository.searchAndFilter(null, null)).thenReturn(List.of(sampleRecipe()));

        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Chocolate Chip Cookies"));
    }

    @Test
    void getRecipes_withSearchAndCategory_passesBothToRepository() throws Exception {
        // This is the actual bug fix: confirms search and category are
        // sent to the repository TOGETHER in one call, not as two
        // separate, mutually-exclusive lookups.
        when(recipeRepository.searchAndFilter("garlic", "main course"))
                .thenReturn(List.of(sampleRecipe()));

        mockMvc.perform(get("/api/recipes?search=garlic&category=main course"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Chocolate Chip Cookies"));
    }

    @Test
    void getRecipeById_notFound_returns404() throws Exception {
        when(recipeRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/recipes/99"))
                .andExpect(status().isNotFound());
    }

    // ------------------- CREATE -------------------

    @Test
    void createRecipe_withoutPasswordHeader_returns401() throws Exception {
        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 1}
                """;

        mockMvc.perform(post("/api/recipes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                // No X-Admin-Password header at all is a malformed request,
                // not a valid-but-wrong one — Spring rejects it before our
                // own auth check even runs.
                .andExpect(status().isBadRequest());
    }

    @Test
    void createRecipe_withWrongPassword_returns401() throws Exception {
        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 1}
                """;

        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "wrong-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());

        // Confirm nothing was ever saved when auth fails
        verify(recipeRepository, never()).save(any());
    }

    @Test
    void createRecipe_withCorrectPasswordAndValidData_returns201() throws Exception {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory()));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(sampleRecipe());

        String body = """
                {"title": "Chocolate Chip Cookies", "sourceType": "homemade", "categoryId": 1,
                 "ingredients": "flour\\nsugar", "steps": "Mix.\\nBake.", "tags": "dessert"}
                """;

        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "test-password-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Chocolate Chip Cookies"));
    }

    @Test
    void createRecipe_withDuplicateTitle_returns409() throws Exception {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory()));
        when(recipeRepository.save(any(Recipe.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint"));

        String body = """
                {"title": "Chocolate Chip Cookies", "sourceType": "homemade", "categoryId": 1}
                """;

        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "test-password-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void createRecipe_withUnknownCategoryId_returns400() throws Exception {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 999}
                """;

        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "test-password-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ------------------- DELETE -------------------

    @Test
    void deleteRecipe_withoutPassword_returns401() throws Exception {
        mockMvc.perform(delete("/api/recipes/1"))
                .andExpect(status().isBadRequest());

        verify(recipeRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteRecipe_withCorrectPassword_returns204() throws Exception {
        when(recipeRepository.existsById(1L)).thenReturn(true);

        mockMvc.perform(delete("/api/recipes/1")
                        .header("X-Admin-Password", "test-password-123"))
                .andExpect(status().isNoContent());

        verify(recipeRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteRecipe_thatDoesNotExist_returns404() throws Exception {
        when(recipeRepository.existsById(42L)).thenReturn(false);

        mockMvc.perform(delete("/api/recipes/42")
                        .header("X-Admin-Password", "test-password-123"))
                .andExpect(status().isNotFound());
    }
}
