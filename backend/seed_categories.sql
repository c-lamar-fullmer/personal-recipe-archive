-- Run this once in pgAdmin or psql, after the app has started at least
-- once (so the categories table already exists via Hibernate).
--
-- These names intentionally match the data-category values in your
-- filter chip buttons (index.html), so the category filter endpoint
-- can match them directly with no translation needed.

INSERT INTO categories (name) VALUES
    ('breakfast'),
    ('dessert'),
    ('dinner'),
    ('main_course'),
    ('side');

-- Confirm it worked:
SELECT * FROM categories;
