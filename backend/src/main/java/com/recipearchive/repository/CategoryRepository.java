package com.recipearchive.repository;

import com.recipearchive.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

// Extending JpaRepository gives you save(), findAll(), findById(), delete(), etc.
// for free — no SQL required for basic operations.
public interface CategoryRepository extends JpaRepository<Category, Long> {
}
