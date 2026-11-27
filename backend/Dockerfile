# ---- Stage 1: build the jar with Maven ----
# Using the full Maven image here since this project has no mvnw
# wrapper committed — this stage has Maven pre-installed so it
# doesn't matter.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ---- Stage 2: run it with just a JRE ----
# A much smaller final image — only the JRE and the built jar,
# none of Maven or the source code end up in what actually runs.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/recipe-archive-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
