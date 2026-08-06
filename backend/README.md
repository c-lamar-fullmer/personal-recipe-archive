# Recipe Archive — Backend

## First-time setup

1. **Install prerequisites** (if you don't already have them):
   - Java 17+ (JDK)
   - Maven (or use the VS Code "Extension Pack for Java" + "Spring Boot Extension Pack", which bundles what you need)
   - PostgreSQL running locally

2. **Create the database:**
   ```sql
   CREATE DATABASE recipe_archive;
   ```

3. **Edit `src/main/resources/application.properties`** and replace
   `YOUR_DB_USERNAME` / `YOUR_DB_PASSWORD` with your actual PostgreSQL
   credentials.

4. **Run the app** from this `backend/` folder:
   ```bash
   mvn spring-boot:run
   ```
   Or, in VS Code with the Spring Boot extension installed, open
   `RecipeArchiveApplication.java` and click the "Run" button above `main`.

5. On first run, Hibernate will create the `categories` and `recipes`
   tables for you automatically (empty — no seed data yet).

## Test it before touching the frontend

With the server running, open Postman (or your browser) and try:
- `GET http://localhost:8080/api/recipes` → should return `[]` (empty list, since there's no data yet)
- Once you add a category and recipe manually via pgAdmin/psql, re-run the same request and confirm it comes back as JSON.

## What's next

This skeleton only covers the **read** endpoints (list/search/filter and
get-by-id). The next step is adding the password-protected `POST`, `PUT`,
and `DELETE` endpoints for the admin edit features — ask your assistant
for help with that once these read endpoints are confirmed working.
