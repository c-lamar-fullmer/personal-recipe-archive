package com.recipearchive.controller;

// Jackson library used by Spring to convert between Java objects and JSON.
// Note: ObjectMapper is currently not used directly in this test file.
import com.fasterxml.jackson.databind.ObjectMapper;

// Our model/entity classes used to create sample test data.
import com.recipearchive.model.Category;
import com.recipearchive.model.Recipe;

// Our repository interfaces. In these tests, they are replaced with mocks,
// so no real PostgreSQL database is needed.
import com.recipearchive.repository.CategoryRepository;
import com.recipearchive.repository.RecipeRepository;

// JUnit annotation used to mark methods as tests.
import org.junit.jupiter.api.Test;

// Allows Spring to inject objects such as MockMvc into the test.
import org.springframework.beans.factory.annotation.Autowired;

// Loads only the web/controller layer for testing instead of the entire app.
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

// Replaces a real Spring bean with a Mockito mock for testing.
import org.springframework.boot.test.mock.mockito.MockBean;

// Exception that represents a database constraint violation,
// such as trying to create a recipe with a duplicate title.
import org.springframework.dao.DataIntegrityViolationException;

// Used to tell Spring that the request body contains JSON.
import org.springframework.http.MediaType;

// Provides test-specific application properties.
import org.springframework.test.context.TestPropertySource;

// Allows us to simulate HTTP requests without starting a real web server.
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

// Mockito tools for creating and checking mock behavior.
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

// Gives us get(), post(), delete(), etc. for creating fake HTTP requests.
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

// Gives us status(), jsonPath(), etc. for checking HTTP responses.
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


// ===============================================================
// TEST CONFIGURATION
// ===============================================================
//
// @WebMvcTest loads only the web/controller layer.
// It does NOT connect to the real PostgreSQL database.
//
// The repositories are replaced with fake Mockito repositories
// using @MockBean. This lets each test decide exactly what the
// repositories should return.
//
// @TestPropertySource provides a test-only admin password.
// This keeps the tests independent of the real application.properties
// file, which is gitignored and not included in the repository.
//
@WebMvcTest(RecipeController.class)
@TestPropertySource(properties = "admin.password=test-password-123")
class RecipeControllerTest {

    // MockMvc lets us simulate HTTP requests such as GET, POST,
    // and DELETE without needing to run a real web browser or server.
    @Autowired
    private MockMvc mockMvc;

    // ObjectMapper converts between Java objects and JSON.
    // It is currently not used directly in these tests, so it could
    // be removed unless it is needed for future tests.
    @Autowired
    private ObjectMapper objectMapper;

    // A fake RecipeRepository used only during testing.
    // No real database operations happen through this repository.
    @MockBean
    private RecipeRepository recipeRepository;

    // A fake CategoryRepository used only during testing.
    @MockBean
    private CategoryRepository categoryRepository;


    // ===============================================================
    // TEST DATA HELPERS
    // ===============================================================

    // Creates a sample Category that can be reused by multiple tests.
    // Using a helper method prevents us from having to recreate the
    // same Category object in every test.
    private Category sampleCategory() {
        Category category = new Category("dessert");

        // Normally the database would generate the ID.
        // Here we manually assign one because this is fake test data.
        category.setId(1L);

        return category;
    }

    // Creates a sample Recipe that can be reused by multiple tests.
    private Recipe sampleRecipe() {
        Recipe recipe = new Recipe();

        // Normally PostgreSQL would generate the ID.
        // We manually assign one for our test data.
        recipe.setId(1L);

        recipe.setTitle("Chocolate Chip Cookies");

        // Connect the recipe to our sample "dessert" category.
        recipe.setCategory(sampleCategory());

        recipe.setSourceType("homemade");

        // \n creates a new line inside the test data.
        recipe.setIngredients("flour\nsugar\nchocolate chips");
        recipe.setSteps("Mix.\nBake.");
        recipe.setTags("dessert\nclassic");

        return recipe;
    }


    // ===============================================================
    // READ — GET REQUESTS
    // ===============================================================

    @Test
    void getRecipes_returnsOkAndList() throws Exception {

        // Tell the fake repository what to return when the controller
        // searches with no search term and no category.
        //
        // In other words:
        // searchAndFilter(null, null) → return one sample recipe.
        when(recipeRepository.searchAndFilter(null, null))
                .thenReturn(List.of(sampleRecipe()));

        // Simulate:
        // GET /api/recipes
        mockMvc.perform(get("/api/recipes"))

                // The controller should respond with HTTP 200 OK.
                .andExpect(status().isOk())

                // Check the JSON response.
                // $[0] means "the first item in the returned JSON array".
                // .title means "look at that item's title".
                .andExpect(jsonPath("$[0].title")
                        .value("Chocolate Chip Cookies"));
    }


    @Test
    void getRecipes_withSearchAndCategory_passesBothToRepository() throws Exception {

        // Tell the mock repository what to return when BOTH
        // search and category are provided.
        //
        // This verifies that the controller passes both values
        // to searchAndFilter() together.
        when(recipeRepository.searchAndFilter("garlic", "main course"))
                .thenReturn(List.of(sampleRecipe()));

        // Simulate:
        // GET /api/recipes?search=garlic&category=main course
        mockMvc.perform(
                get("/api/recipes?search=garlic&category=main course")
        )

                // The request should succeed.
                .andExpect(status().isOk())

                // Confirm that a recipe was returned.
                .andExpect(jsonPath("$[0].title")
                        .value("Chocolate Chip Cookies"));
    }


    @Test
    void getRecipeById_notFound_returns404() throws Exception {

        // Tell the fake repository to pretend that recipe 99
        // does not exist.
        //
        // Optional.empty() represents "nothing was found".
        when(recipeRepository.findById(99L))
                .thenReturn(Optional.empty());

        // Simulate:
        // GET /api/recipes/99
        mockMvc.perform(get("/api/recipes/99"))

                // Since the recipe doesn't exist, expect:
                // HTTP 404 Not Found.
                .andExpect(status().isNotFound());
    }


    // ===============================================================
    // CREATE — POST REQUESTS
    // ===============================================================

    @Test
    void createRecipe_withoutPasswordHeader_returns400() throws Exception {

        // JSON that will be sent as the POST request body.
        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 1}
                """;

        // Simulate:
        // POST /api/recipes
        //
        // No X-Admin-Password header is included.
        mockMvc.perform(post("/api/recipes")

                        // Tell Spring that the request body is JSON.
                        .contentType(MediaType.APPLICATION_JSON)

                        // Put our JSON into the request body.
                        .content(body))

                // No password header is treated as a malformed request
                // and Spring rejects it before the controller's own
                // password comparison logic runs.
                .andExpect(status().isBadRequest());
    }


    @Test
    void createRecipe_withWrongPassword_returns401() throws Exception {

        // JSON request body.
        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 1}
                """;

        // Simulate a POST request with an incorrect admin password.
        mockMvc.perform(post("/api/recipes")

                        // Send the wrong password in the authentication header.
                        .header("X-Admin-Password", "wrong-password")

                        // Tell Spring the body contains JSON.
                        .contentType(MediaType.APPLICATION_JSON)

                        // Add the recipe data to the request body.
                        .content(body))

                // The password was provided but is incorrect,
                // so the controller should return 401 Unauthorized.
                .andExpect(status().isUnauthorized());

        // Make sure the recipe was NEVER saved.
        //
        // This is important because a failed authentication attempt
        // should not be allowed to modify the database.
        verify(recipeRepository, never()).save(any());
    }


    @Test
    void createRecipe_withCorrectPasswordAndValidData_returns201() throws Exception {

        // Tell the fake CategoryRepository that category 1 exists.
        when(categoryRepository.findById(1L))
                .thenReturn(Optional.of(sampleCategory()));

        // Tell the fake RecipeRepository that saving any Recipe
        // should return our sample Recipe.
        //
        // any(Recipe.class) means "any Recipe object".
        when(recipeRepository.save(any(Recipe.class)))
                .thenReturn(sampleRecipe());

        // JSON data sent in the POST request.
        String body = """
                {"title": "Chocolate Chip Cookies", "sourceType": "homemade", "categoryId": 1,
                 "ingredients": "flour\\nsugar", "steps": "Mix.\\nBake.", "tags": "dessert"}
                """;

        // Simulate a valid POST request.
        mockMvc.perform(post("/api/recipes")

                        // Correct admin password.
                        .header("X-Admin-Password", "test-password-123")

                        // Request body is JSON.
                        .contentType(MediaType.APPLICATION_JSON)

                        // Add the recipe JSON to the request.
                        .content(body))

                // Successful creation should return HTTP 201 Created.
                .andExpect(status().isCreated())

                // Check that the returned recipe has the expected title.
                .andExpect(jsonPath("$.title")
                        .value("Chocolate Chip Cookies"));
    }


    @Test
    void createRecipe_withDuplicateTitle_returns409() throws Exception {

        // Pretend that category 1 exists.
        when(categoryRepository.findById(1L))
                .thenReturn(Optional.of(sampleCategory()));

        // Pretend that PostgreSQL rejects the recipe because the
        // title already exists and violates the UNIQUE constraint.
        when(recipeRepository.save(any(Recipe.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "duplicate key value violates unique constraint"
                ));

        // JSON request body.
        String body = """
                {"title": "Chocolate Chip Cookies", "sourceType": "homemade", "categoryId": 1}
                """;

        // Send the request using the correct admin password.
        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "test-password-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))

                // The controller should translate the database conflict
                // into HTTP 409 Conflict.
                .andExpect(status().isConflict());
    }


    @Test
    void createRecipe_withUnknownCategoryId_returns400() throws Exception {

        // Pretend category 999 does NOT exist.
        when(categoryRepository.findById(999L))
                .thenReturn(Optional.empty());

        // Request references the nonexistent category.
        String body = """
                {"title": "Test Recipe", "sourceType": "homemade", "categoryId": 999}
                """;

        // Send the request.
        mockMvc.perform(post("/api/recipes")
                        .header("X-Admin-Password", "test-password-123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))

                // The invalid category should result in HTTP 400 Bad Request.
                .andExpect(status().isBadRequest());
    }


    // ===============================================================
    // DELETE — DELETE REQUESTS
    // ===============================================================

    @Test
    void deleteRecipe_withoutPassword_returns400() throws Exception {

        // Simulate:
        // DELETE /api/recipes/1
        //
        // No admin password is provided.
        mockMvc.perform(delete("/api/recipes/1"))

                // A missing required password header is treated as
                // a malformed request, so Spring returns 400.
                .andExpect(status().isBadRequest());

        // Make sure the recipe was NOT deleted.
        verify(recipeRepository, never()).deleteById(anyLong());
    }


    @Test
    void deleteRecipe_withCorrectPassword_returns204() throws Exception {

        // Tell the mock repository that recipe 1 exists.
        when(recipeRepository.existsById(1L))
                .thenReturn(true);

        // Simulate:
        // DELETE /api/recipes/1
        //
        // with the correct admin password.
        mockMvc.perform(delete("/api/recipes/1")
                        .header("X-Admin-Password", "test-password-123"))

                // Successful deletion returns:
                // HTTP 204 No Content.
                .andExpect(status().isNoContent());

        // Confirm that deleteById(1L) was called exactly once.
        verify(recipeRepository, times(1)).deleteById(1L);
    }


    @Test
    void deleteRecipe_thatDoesNotExist_returns404() throws Exception {

        // Tell the fake repository that recipe 42 does not exist.
        when(recipeRepository.existsById(42L))
                .thenReturn(false);

        // Simulate:
        // DELETE /api/recipes/42
        mockMvc.perform(delete("/api/recipes/42")
                        .header("X-Admin-Password", "test-password-123"))

                // Since the recipe doesn't exist, expect:
                // HTTP 404 Not Found.
                .andExpect(status().isNotFound());
    }
}