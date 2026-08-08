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

3. **Edit `src/main/resources/application.properties`:**
   - Replace `YOUR_DB_USERNAME` / `YOUR_DB_PASSWORD` with your actual PostgreSQL credentials.
   - Set `admin.password` to whatever you want the edit-mode password to be (this protects create/edit/delete — it's separate from your database password).

4. **Run the app** from this `backend/` folder:
   ```bash
   mvn spring-boot:run
   ```
   Or, in VS Code, open `RecipeArchiveApplication.java` and click the "Run" button above `main`.

5. On first run, Hibernate creates the `categories` and `recipes` tables automatically.

6. **Seed the categories** (one-time, required before creating any recipes):
   Run the statements in `seed_categories.sql` in pgAdmin or psql. Recipes can't be created until at least one category exists, since `category_id` is a required foreign key.

## API reference

All endpoints are under `http://localhost:8080/api`.

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| GET | `/recipes` | No | List all recipes |
| GET | `/recipes?search={term}` | No | Search title, ingredients, steps, and tags |
| GET | `/recipes?category={name}` | No | Filter by category |
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
GET http://localhost:8080/api/recipes        → [] until you've seeded categories and added a recipe
POST http://localhost:8080/api/recipes       → header X-Admin-Password: <your password>, body: 
  { "title": "Test Recipe", "sourceType": "homemade", "ingredients": "eggs\nflour", "steps": "Mix\nBake", "tags": "easy", "categoryId": 1 }
```

## Project structure

```
backend/
├── pom.xml
├── seed_categories.sql
└── src/main/
    ├── java/com/recipearchive/
    │   ├── RecipeArchiveApplication.java
    │   ├── model/          → Category, Recipe (JPA entities)
    │   ├── repository/     → CategoryRepository, RecipeRepository
    │   ├── dto/             → RecipeRequest (incoming create/update payload)
    │   └── controller/     → RecipeController, CategoryController, AdminController
    └── resources/
        └── application.properties
```

## Known limitations (Phase 1 scope)

- **Search and category filter are mutually exclusive in one request** — the API doesn't yet support combining both at once. A worthwhile refinement if there's time before final submission.
- **Admin auth is a single hardcoded password**, not a full authentication system. This was an intentional, documented scope decision — see the presentation's architecture slide for the reasoning.
- **`admin.password` and your database credentials currently live in plain text** in `application.properties`. Fine for local development, but **do not commit real credentials to a public GitHub repo** — see the note below before pushing.

## Before pushing to GitHub

Make sure `application.properties` isn't committed with your real password
in it. Either add it to `.gitignore` and commit an `application.properties.example`
with placeholder values instead, or double check your `.gitignore` already
covers it before your first `git push`.
