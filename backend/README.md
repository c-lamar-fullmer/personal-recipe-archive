# Recipe Archive — Backend

A Spring Boot + PostgreSQL REST API for the Personal Recipe Archive.
Serves recipe data to the frontend and exposes password-protected
endpoints for the developer to create, edit, and delete recipes.

## First-time setup

1. **Install prerequisites** (if you don't already have them):
   - Java 17+ (JDK)
   - Maven (or use the VS Code "Extension Pack for Java" + "Spring Boot Extension Pack")
   - PostgreSQL running locally

2. **Create the database:**
   ```sql
   CREATE DATABASE recipe_archive;
   ```

3. **Set up your local config:**
   Copy `src/main/resources/application.properties.example` to
   `application.properties` in that same folder, then edit it:
   - Replace `YOUR_DB_USERNAME` / `YOUR_DB_PASSWORD` with your actual PostgreSQL credentials.
   - Replace `YOUR_ADMIN_PASSWORD` with whatever you want the edit-mode password to be (this protects create/edit/delete — it's separate from your database password).

   `application.properties` is listed in `.gitignore` and will not be committed — only the placeholder `.example` file is tracked in Git.

4. **Run the app** from this `backend/` folder:
   ```bash
   mvn spring-boot:run
   ```
   Or, in VS Code, open `RecipeArchiveApplication.java` and click the "Run" button above `main`.

5. On first run, Hibernate creates the `categories` and `recipes` tables automatically.

6. **Seed categories and placeholder recipes** (one-time, required before creating any recipes):
   Run the statements in `reset_and_seed_data.sql` in pgAdmin or psql. Recipes can't be created until at least one category exists, since `category_id` is a required foreign key. This script also loads a handful of placeholder recipes, which is useful for demoing the app (e.g. on GitHub) without it looking empty.
   ⚠️ Run this *after* the app has started at least once, so Hibernate has already created the `categories`/`recipes` tables (and all columns, including `notes`) for the script to insert into.

## API reference

All endpoints are under `http://localhost:8080/api`.

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/recipes` | No | List all recipes |
| GET | `/recipes?search={term}` | No | Search title, ingredients, steps, and tags |
| GET | `/recipes?category={name}` | No | Filter by category |
| GET | `/recipes?search={term}&category={name}` | No | Search and category filter applied **together** — a recipe must match both |
| GET | `/recipes/{id}` | No | Get one recipe's full details |
| GET | `/categories` | No | List all categories (used by the admin form dropdown) |
| POST | `/admin/validate` | Header `X-Admin-Password` | Check whether a password is correct |
| POST | `/recipes` | Header `X-Admin-Password` | Create a recipe |
| PUT | `/recipes/{id}` | Header `X-Admin-Password` | Update a recipe |
| DELETE | `/recipes/{id}` | Header `X-Admin-Password` | Delete a recipe |

Recipe titles are unique — a duplicate `POST`/`PUT` returns `409 Conflict`.
A missing or incorrect `X-Admin-Password` header on a protected endpoint
returns `401 Unauthorized`.

## Quick test with Postman

```
GET http://localhost:8080/api/recipes
  → [] until you've seeded categories and added a recipe

GET http://localhost:8080/api/recipes?search=garlic&category=main course
  → combined filtering: only "main course" recipes that also mention "garlic"

POST http://localhost:8080/api/recipes
  → header X-Admin-Password: <your password>, body:
  { "title": "Test Recipe", "sourceType": "homemade", "notes": "Great with rice",
    "ingredients": "eggs\nflour", "steps": "Mix\nBake", "tags": "easy", "categoryId": 1 }
```

## Running the tests

```bash
mvn test
```

Runs 14 JUnit tests (`RecipeControllerTest`, `AdminControllerTest`) covering
the read endpoints, password-protected create/update/delete, duplicate-title
handling, and the combined search+category filter. These use `@WebMvcTest`
with mocked repositories, so they run without a live database connection —
they'll pass the same way for anyone who clones this repo, regardless of
their local PostgreSQL setup.

## Project structure

```
backend/
├── pom.xml
├── reset_and_seed_data.sql
└── src/
    ├── main/
    │   ├── java/com/recipearchive/
    │   │   ├── RecipeArchiveApplication.java
    │   │   ├── model/          → Category, Recipe (JPA entities)
    │   │   ├── repository/     → CategoryRepository, RecipeRepository
    │   │   ├── dto/             → RecipeRequest (incoming create/update payload)
    │   │   └── controller/     → RecipeController, CategoryController, AdminController
    │   └── resources/
    │       ├── application.properties           (gitignored — not committed)
    │       └── application.properties.example    (committed template)
    └── test/
        └── java/com/recipearchive/controller/
            ├── RecipeControllerTest.java
            └── AdminControllerTest.java
```

## Known limitations (Phase 1 scope)

- **Categories are a fixed set** (Breakfast, Dessert, Main Course, Side, Sauce) loaded by the seed script — there's no endpoint to add a new category through the app itself. Adding one currently means an `INSERT` directly in the database.
- **Admin auth is a single hardcoded password**, not a full authentication system. This was an intentional, documented scope decision — see the presentation's architecture slide for the reasoning.
- **Tests are controller-layer only** (`@WebMvcTest` with mocked repositories) — they verify endpoint behavior, request validation, and auth, but not full end-to-end behavior against a live PostgreSQL database.

## Credential handling

`application.properties` (real database and admin credentials) is listed in
`.gitignore` and is never committed. `application.properties.example` holds
placeholder values and is the version tracked in Git — anyone cloning this
repo copies it, fills in their own credentials, and is up and running
without ever seeing real secrets.