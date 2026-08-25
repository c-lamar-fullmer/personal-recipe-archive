package com.recipearchive.repository;

import com.recipearchive.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // Combines the search bar and the category filter into ONE query
    // instead of treating them as mutually exclusive. Either parameter
    // can be null:
    //   - search = null  -> ignore search, match every recipe on that side
    //   - category = null -> ignore category, match every recipe on that side
    //   - both null       -> returns everything (same as findAll())
    //   - both provided   -> a recipe must satisfy BOTH conditions
    //
    // CAST(... AS string) is required here for PostgreSQL specifically:
    // a null parameter bound with no type hint gets sent as `bytea` by
    // the driver, and PostgreSQL then fails with "function lower(bytea)
    // does not exist" — the whole query is type-checked once when
    // prepared, before it knows the parameter will actually be null at
    // runtime. The cast tells Postgres up front "this is always text,"
    // regardless of whether the bound value ends up null.
    @Query("""
            SELECT r FROM Recipe r
            WHERE (:category IS NULL OR LOWER(r.category.name) = LOWER(CAST(:category AS string)))
            AND (:search IS NULL
                 OR LOWER(r.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(r.ingredients) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(r.steps) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(r.tags) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            """)
    List<Recipe> searchAndFilter(@Param("search") String search, @Param("category") String category);
}
