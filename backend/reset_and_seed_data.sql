-- ============================================================
-- Reset & seed script — for placeholder/demo data (e.g. before
-- pushing to GitHub so the app isn't shown empty).
--
-- Run this AFTER restarting the backend at least once with the
-- new `notes` field on Recipe (so the column already exists).
--
-- WARNING: this deletes all existing recipes and categories first.
-- Fine for demo/test data — do NOT run this against real data you
-- want to keep.
-- ============================================================

TRUNCATE TABLE recipes, categories RESTART IDENTITY CASCADE;

-- Final category list — exactly these five, matching the filter
-- chips in index.html.
INSERT INTO categories (name) VALUES
    ('breakfast'),
    ('dessert'),
    ('main course'),
    ('side'),
    ('sauce');

-- Placeholder recipes, one or two per category, mixing homemade
-- and external, so search/filter/detail views all have something
-- real to show on GitHub.
INSERT INTO recipes (category_id, title, source_type, url, notes, ingredients, steps, tags) VALUES
    (
        (SELECT id FROM categories WHERE name = 'breakfast'),
        'Fluffy Pancakes',
        'homemade',
        NULL,
        'Great with fresh berries. Double the batch for weekend guests.',
        'flour
milk
eggs
baking powder
sugar
pinch of salt',
        'Whisk dry ingredients together.
Add milk and eggs, mix until just combined.
Cook on a hot griddle until bubbles form, then flip.',
        'breakfast
easy
kid-friendly'
    ),
    (
        (SELECT id FROM categories WHERE name = 'breakfast'),
        'Overnight Oats',
        'external',
        'https://example.com/overnight-oats',
        'Prep the night before — ready to grab on busy mornings.',
        NULL,
        NULL,
        'breakfast
make-ahead
healthy'
    ),
    (
        (SELECT id FROM categories WHERE name = 'dessert'),
        'Classic Chocolate Chip Cookies',
        'homemade',
        NULL,
        'Chill the dough for 30 minutes for a thicker cookie.',
        'flour
butter
brown sugar
eggs
chocolate chips
vanilla extract',
        'Cream butter and sugar together.
Mix in eggs and vanilla.
Fold in flour and chocolate chips.
Bake at 375F for 10 minutes.',
        'dessert
classic
crowd-pleaser'
    ),
    (
        (SELECT id FROM categories WHERE name = 'main course'),
        'Creamy Garlic Pasta',
        'homemade',
        NULL,
        'Ready in under 20 minutes — good for busy weeknights.',
        'pasta
garlic
heavy cream
parmesan
butter
black pepper',
        'Boil pasta until al dente.
Saute garlic in butter until fragrant.
Add cream and parmesan, simmer until thickened.
Toss with pasta.',
        'dinner
quick
comfort food'
    ),
    (
        (SELECT id FROM categories WHERE name = 'main course'),
        'Sheet Pan Chicken Fajitas',
        'external',
        'https://example.com/sheet-pan-fajitas',
        'One pan, easy cleanup. Great for meal prep.',
        NULL,
        NULL,
        'dinner
easy
meal-prep'
    ),
    (
        (SELECT id FROM categories WHERE name = 'side'),
        'Roasted Garlic Potatoes',
        'homemade',
        NULL,
        'Crank the oven as high as it goes for the crispiest edges.',
        'baby potatoes
olive oil
garlic
rosemary
salt',
        'Toss potatoes with oil, garlic, and rosemary.
Roast at 425F for 35-40 minutes, flipping halfway.',
        'side
vegetarian
easy'
    ),
    (
        (SELECT id FROM categories WHERE name = 'sauce'),
        'Simple Marinara',
        'homemade',
        NULL,
        'Freezes well — make a double batch.',
        'crushed tomatoes
garlic
olive oil
basil
salt',
        'Saute garlic in olive oil until fragrant.
Add crushed tomatoes and simmer for 20 minutes.
Stir in fresh basil and salt to taste.',
        'sauce
italian
freezer-friendly'
    ),
    (
        (SELECT id FROM categories WHERE name = 'sauce'),
        'Homemade Pesto',
        'homemade',
        NULL,
        'Toast the pine nuts first for extra flavor.',
        'basil
pine nuts
parmesan
garlic
olive oil',
        'Blend basil, pine nuts, garlic, and parmesan.
Slowly stream in olive oil while blending until smooth.',
        'sauce
italian
no-cook'
    );
