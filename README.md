# Personal Recipe Archive

A full-stack recipe archive with a Java Spring Boot REST API, PostgreSQL database, and a dependency-free HTML/CSS/JavaScript frontend.

## Prerequisites

Install the following before running the application. The links below point to the official download or installation pages:

- [Java Development Kit (JDK) 17 or later](https://adoptium.net/temurin/releases/)
- [Apache Maven 3.9 or later](https://maven.apache.org/install.html)
- [PostgreSQL 14 or later](https://www.postgresql.org/download/), running locally
- A modern web browser

The frontend does not require Node.js or npm. To use the command-line frontend server described below, install [Python 3](https://www.python.org/downloads/). A VS Code Live Server extension can be used instead. Maven downloads the Java libraries listed in `backend/pom.xml` during the first build.

You can verify the command-line prerequisites with:

```bash
java -version
mvn -version
python3 --version
```

## Installation

1. Clone or extract this repository and open a terminal in the project root.

2. Create the PostgreSQL database:

   ```sql
   CREATE DATABASE recipe_archive;
   ```

   This can be run in `psql` or pgAdmin.

3. Create the backend configuration file:

   ```bash
   cp backend/src/main/resources/application.properties.example \
      backend/src/main/resources/application.properties
   ```

4. Open `backend/src/main/resources/application.properties` and replace:

   - `YOUR_DB_USERNAME` with your PostgreSQL username
   - `YOUR_DB_PASSWORD` with your PostgreSQL password
   - `YOUR_ADMIN_PASSWORD` with the password used by the recipe editing screen

   Do not commit this file. It contains local credentials and is ignored by Git.

## Run the application

The backend and frontend run as separate processes.

### 1. Start the backend

From the project root:

```bash
cd backend
mvn spring-boot:run
```

The REST API starts at `http://localhost:8080/api`. On the first start, Hibernate creates the database tables automatically.

### 2. Seed the database

After the backend has started successfully at least once, run `backend/reset_and_seed_data.sql` in pgAdmin or `psql` while connected to the `recipe_archive` database. This inserts the application categories and demonstration recipes.

The seed script is intended to be run after Hibernate creates the tables. It can be run again to reset and reload the sample data according to the statements in the script.

### 3. Start the frontend

Leave the backend running, open a second terminal from the project root, and serve the frontend files:

```bash
python3 -m http.server 5500 --directory frontend
```

Open `http://localhost:5500` in a browser. The frontend calls the backend at `http://localhost:8080/api`.

Alternatively, open `frontend/index.html` with a VS Code Live Server extension.

## Use the application

- Browse, search, and filter the seeded recipes from the main screen.
- Select **Edit Recipes**, enter the admin password from `application.properties`, and use the admin screen to add, edit, or delete recipes.
- The API supports recipe and category reads plus password-protected recipe management. The detailed endpoint list is in [backend/README.md](backend/README.md).

## Run the tests

From the project root:

```bash
cd backend
mvn test
```

The tests use Spring MVC test support and mocked repositories, so they do not require PostgreSQL to be running.

## Project structure

```text
personal-recipe-archive/
├── README.md                         # Installation and run instructions
├── backend/
│   ├── pom.xml                       # Java dependencies and build configuration
│   ├── reset_and_seed_data.sql       # Demo database data
│   └── src/
│       ├── main/java/                # Spring Boot application, API, entities, repositories
│       ├── main/resources/
│       │   └── application.properties.example
│       └── test/java/                # Controller tests
└── frontend/
    ├── index.html
    ├── app.js
    └── style.css
```
