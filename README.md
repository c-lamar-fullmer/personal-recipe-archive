# Personal Recipe Archive

A small full-stack recipe archive: a plain HTML/CSS/JavaScript frontend, a
Spring Boot REST API, and PostgreSQL. The frontend needs no Node.js or npm.

The project can run locally against a teacher's own PostgreSQL database or be
shown online with the Render deployment. The local and deployed databases are
separate.

## Run locally

### Prerequisites

- Java 17 or later
- Maven 3.9 or later (`mvnw` is not included)
- PostgreSQL 14 or later, running locally
- A browser and either Python 3 or the VS Code Live Server extension

Check Java and Maven from a terminal:

```bash
java -version
mvn -version
```

### 1. Clone the repository and create a database

Clone the repository and open its root directory:

```bash
git clone https://github.com/c-lamar-fullmer/personal-recipe-archive.git
cd personal-recipe-archive
```

Create an empty PostgreSQL database named `recipe_archive` using pgAdmin or
`psql`:

```sql
CREATE DATABASE recipe_archive;
```

### 2. Add local settings

From the repository root, copy the example settings file:

```bash
cp backend/src/main/resources/application.properties.example \
   backend/src/main/resources/application.properties
```

Edit `backend/src/main/resources/application.properties` and replace
`YOUR_DB_USERNAME`, `YOUR_DB_PASSWORD`, and `YOUR_ADMIN_PASSWORD` with values
for this computer. The database username and password are PostgreSQL
credentials; the admin password is the one used by the recipe editor.

This local settings file is ignored by Git and must not be committed. Each
person cloning the project creates their own copy. The example file contains
placeholders, not working credentials.

### 3. Start the backend

In a terminal from the repository root:

```bash
cd backend
mvn spring-boot:run
```

Keep this terminal running. On its first successful start, Hibernate creates
the application tables in the local `recipe_archive` database.

### 4. Load the demo recipes

The demo data is in [`backend/seed_demo_data.sql`](backend/seed_demo_data.sql).
Run it once against the `recipe_archive` database, after the backend has
started and created its tables. For example, from the repository root:

```bash
psql -U your_postgres_user -d recipe_archive -f backend/seed_demo_data.sql
```

Replace `your_postgres_user` with the PostgreSQL username from your local
settings. Alternatively, open the SQL file in pgAdmin's Query Tool connected
to `recipe_archive` and execute it.

The seed script refuses to run if recipes or categories already exist; it
does not delete existing data. If you intentionally want to erase the local
recipes and categories, run [`backend/reset_data.sql`](backend/reset_data.sql)
first, then run the seed script again. **Resetting deletes all recipe and
category data in the selected database.**

### 5. Start the frontend

Open a second terminal at the repository root and serve the frontend:

```bash
python3 -m http.server 5500 --directory frontend
```

Visit <http://localhost:5500>. Alternatively, open `frontend/index.html` with
VS Code Live Server. Do not open the HTML file directly from the filesystem.

When served on `localhost` or `127.0.0.1`, the frontend automatically calls
the local API at `http://localhost:8080/api`. On a non-localhost site, it uses
the Render API. This lets local work use the local database without changing
the deployed site's configuration.

You can check the local API directly at
<http://localhost:8080/api/recipes>. If the page cannot load recipes, make
sure PostgreSQL and the backend are running and that the local settings point
to the `recipe_archive` database.

## Tests

From the repository root:

```bash
cd backend
mvn test
```

The controller tests use mocked repositories, so PostgreSQL does not need to
be running to execute the tests.

## Render deployment

The committed
[`backend/src/main/resources/application-prod.properties`](backend/src/main/resources/application-prod.properties)
uses environment variables rather than committed credentials. Configure these
in the Render backend service:

- `SPRING_PROFILES_ACTIVE=prod`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `ADMIN_PASSWORD`

Keep these values private and do not put production credentials in the
repository or in frontend JavaScript. The hosted backend uses its own
database; local changes do not update it.

## Dockerfile

[`backend/Dockerfile`](backend/Dockerfile) builds a container image for the
backend. It does not create or run PostgreSQL and does not serve the frontend.
Docker is **not required** for the local setup above. Keep the file if the
Render backend is configured to deploy from a Dockerfile; otherwise it is
optional and can be removed separately.

## Project notes

- Categories are a fixed set loaded by the demo data script.
- Admin editing uses one shared password, not individual accounts or
  production-grade authentication. It is suitable for a small demo, not for
  protecting sensitive data.
- The backend API is under `http://localhost:8080/api` when run locally.
