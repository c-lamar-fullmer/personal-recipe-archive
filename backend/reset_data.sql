-- Destructively clear all recipe and category data.
-- Run only when you intentionally want to erase the local database contents.

TRUNCATE TABLE recipes, categories RESTART IDENTITY CASCADE;
