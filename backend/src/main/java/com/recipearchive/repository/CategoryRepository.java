package com.recipearchive.repository;

// imports Category.java , the blueprint for the Category table in the database
import com.recipearchive.model.Category;
// imports JpaRepository (Java Persistance API), which is a Spring Data interface that provides CRUD operations for the entity class
import org.springframework.data.jpa.repository.JpaRepository;

// Extending JpaRepository gives you save(), findAll(), findById(), delete(), etc.
// for free — no SQL required for basic operations.

// interface is a contract that defines the methods that a class must implement,
// but it does not provide any implementation itself.
// In this case, CategoryRepository is an interface that extends JpaRepository,
// which means it inherits all the methods defined in JpaRepository
// and can also define additional methods specific to the Category entity.
public interface CategoryRepository extends JpaRepository<Category, Long> {
}
