-- ============================================================
-- Demo data seed script — generic recipes for demonstration.
--
-- Run this AFTER starting the backend once so Hibernate has created
-- the tables and the current `notes` column.
--
-- This script refuses to run if either table already contains data.
-- Use reset_data.sql only when you intentionally want to erase data.
-- ============================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM categories) OR EXISTS (SELECT 1 FROM recipes) THEN
        RAISE EXCEPTION 'Demo data was not loaded: categories or recipes already contain data. Use reset_data.sql only if you intend to erase it.';
    END IF;
END;
$$;

-- Final category list — exactly these five, matching the filter chips.
INSERT INTO categories (name) VALUES
    ('breakfast'),
    ('dessert'),
    ('main course'),
    ('side'),
    ('sauce');

-- A small set of generic demo recipes (no personal names or notes).
INSERT INTO recipes (category_id, title, source_type, url, notes, ingredients, steps, tags) VALUES
(
    (SELECT id FROM categories WHERE name = 'breakfast'),
    'Banana Chocolate Muffins',
    'homemade',
    NULL,
    'Makes about 12 muffins.',
    '2 ripe bananas
2 eggs
1/3 cup melted butter
1/2 cup brown sugar
1 tsp vanilla extract
1 tsp baking soda
1/2 tsp salt
1 1/2 cups all-purpose flour
1/2 cup chocolate chips',
    'Preheat oven to 350°F.
Mash the bananas in a bowl.
Mix in eggs, melted butter, sugar, and vanilla.
Stir in baking soda, salt, and flour until just combined.
Fold in chocolate chips.
Divide batter into a muffin tin and bake for 18-22 minutes, or until a toothpick comes out clean.',
    'breakfast
muffins
banana
chocolate'
),
(
    (SELECT id FROM categories WHERE name = 'breakfast'),
    'Simple Crepes',
    'homemade',
    NULL,
    'Makes about 8 crepes.',
    '1 cup all-purpose flour
1 1/2 cups milk
3 eggs
1/2 tsp salt
1 tsp sugar
2 tbsp vegetable oil',
    'Whisk all ingredients until smooth.
Heat a lightly greased skillet over medium heat.
Pour in a small amount of batter and swirl to coat the pan.
Cook until the edges lift, then flip and cook briefly on the other side.
Serve with fruit, jam, or other toppings.',
    'breakfast
crepes
quick'
),
(
    (SELECT id FROM categories WHERE name = 'dessert'),
    'Apple Crisp',
    'homemade',
    NULL,
    'Serve warm, optionally with vanilla ice cream.',
    '3 cups diced apples
3/4 cup all-purpose flour
1 tsp cinnamon
1 cup brown sugar
3/4 cup rolled oats
1/2 cup butter',
    'Preheat oven to 350°F.
Place apples in a greased baking dish.
Mix brown sugar, flour, oats, and cinnamon; cut in butter until crumbly.
Sprinkle topping over apples.
Bake for 30-40 minutes, until the topping is golden and apples are tender.',
    'dessert
crisp
apple'
),
(
    (SELECT id FROM categories WHERE name = 'dessert'),
    'Classic Sugar Cookies',
    'homemade',
    NULL,
    'Decorate with frosting or sprinkles if desired.',
    '1 cup butter, softened
1 1/2 cups sugar
2 eggs
2 tbsp milk
2 tsp vanilla
3 1/2 cups all-purpose flour
2 tsp baking powder
1/2 tsp salt',
    'Cream butter and sugar together.
Beat in eggs, milk, and vanilla.
Mix in flour, baking powder, and salt.
Chill dough until firm.
Roll dough on a floured surface and cut into shapes.
Bake at 350°F for 8-10 minutes, until the edges are lightly golden.',
    'dessert
cookies
sugar
baking'
),
(
    (SELECT id FROM categories WHERE name = 'dessert'),
    'No-Bake Chocolate Oat Cookies',
    'homemade',
    NULL,
    'Makes about 24 cookies. Let cool before serving.',
    '1/2 cup butter
2 cups sugar
1/2 cup milk
1/4 cup cocoa powder
1/2 cup peanut butter
1 tsp vanilla
3 cups quick-cooking oats',
    'Combine butter, sugar, milk, and cocoa in a saucepan.
Bring to a boil and boil for 1 minute, stirring.
Remove from heat and stir in peanut butter and vanilla.
Mix in oats.
Drop spoonfuls onto parchment paper and let cool until set.',
    'dessert
cookies
no-bake
chocolate
oats'
),
(
    (SELECT id FROM categories WHERE name = 'main course'),
    'Chicken Alfredo Pasta',
    'homemade',
    NULL,
    'Serve immediately after combining pasta and sauce.',
    '1 lb pasta
2 tbsp butter
1 1/2 cups heavy cream
1 tsp garlic powder
salt and pepper to taste
1/2 cup grated Parmesan cheese
2 chicken breasts, cooked and sliced',
    'Cook pasta according to package directions and drain.
Melt butter in a saucepan over medium-low heat.
Add cream, garlic powder, salt, and pepper; simmer gently until slightly thickened.
Remove from heat and stir in Parmesan.
Toss sauce with pasta and cooked chicken.
Serve warm.',
    'main course
pasta
chicken
alfredo'
),
(
    (SELECT id FROM categories WHERE name = 'main course'),
    'Vegetarian Bean Chili',
    'homemade',
    NULL,
    'A simple one-pot meal. Adjust seasoning to taste.',
    '1 can kidney beans, drained
1 can black beans, drained
1 can corn, drained
1 can diced tomatoes
1 can tomato sauce
1 tbsp chili powder
1 tsp cumin
1 tsp garlic powder
1 tsp onion powder
salt and pepper to taste
1 tbsp lime juice',
    'Add all ingredients to a pot and stir.
Bring to a simmer.
Cook for 15-20 minutes, stirring occasionally.
Taste and adjust seasoning.
Serve with rice, bread, or tortilla chips.',
    'main course
chili
beans
vegetarian'
),
(
    (SELECT id FROM categories WHERE name = 'main course'),
    'Chicken Enchiladas',
    'homemade',
    NULL,
    'Makes approximately 8 enchiladas.',
    '2 cups cooked shredded chicken
8 flour tortillas
1 cup shredded cheddar cheese, plus extra for topping
1 can cream of chicken soup
1/2 cup sour cream
1/2 cup milk
salt and pepper to taste',
    'Preheat oven to 350°F.
Mix soup, sour cream, milk, and cheese in a saucepan until warm and combined.
Reserve some sauce for topping; mix remaining sauce with chicken.
Fill tortillas with chicken mixture and roll.
Place in a baking dish, cover with reserved sauce, and sprinkle with cheese.
Bake for 25-35 minutes, until heated through and cheese is melted.',
    'main course
chicken
enchiladas'
),
(
    (SELECT id FROM categories WHERE name = 'side'),
    'Cilantro Lime Rice',
    'homemade',
    NULL,
    NULL,
    '1 cup rice
2 cups water
1 tbsp oil
1 tsp salt
3 tbsp chopped cilantro
2 tbsp lime juice',
    'Combine rice, water, oil, and salt in a pot or rice cooker.
Cook until rice is tender and water is absorbed.
Fluff with a fork.
Stir in cilantro and lime juice.
Taste and add salt if needed.',
    'side
rice
cilantro
lime'
),
(
    (SELECT id FROM categories WHERE name = 'side'),
    'Green Bean Casserole',
    'homemade',
    NULL,
    'A classic baked vegetable side dish.',
    '1 can condensed cream of mushroom soup
1/2 cup milk
1 tsp soy sauce
4 cups cooked green beans
1 1/3 cups crispy fried onions
salt and pepper to taste',
    'Preheat oven to 350°F.
Mix soup, milk, soy sauce, green beans, and half of the fried onions in a casserole dish.
Season with salt and pepper.
Bake for 25 minutes, until hot.
Stir, top with remaining onions, and bake for 5 more minutes.',
    'side
casserole
green beans'
),
(
    (SELECT id FROM categories WHERE name = 'side'),
    'Bean and Corn Salad',
    'homemade',
    NULL,
    'Serve chilled or at room temperature.',
    '1 red bell pepper, diced
1 cup corn
1 can black beans, drained and rinsed
1/4 cup lime juice
1 tbsp maple syrup
1 tsp chili powder
1/2 tsp cumin
salt to taste
1 avocado, diced',
    'Combine bell pepper, corn, and black beans in a bowl.
Whisk lime juice, maple syrup, chili powder, cumin, and salt.
Pour dressing over the vegetables and toss.
Fold in avocado and serve.',
    'side
salad
beans
corn
vegetarian'
),
(
    (SELECT id FROM categories WHERE name = 'sauce'),
    'Honey Mustard Dipping Sauce',
    'homemade',
    NULL,
    NULL,
    '1/4 cup mayonnaise
1 tbsp honey
1 tbsp mustard
1 tbsp barbecue sauce',
    'Whisk all ingredients together until smooth.
Serve with fries, vegetables, sandwiches, or nuggets.',
    'sauce
dipping sauce
honey mustard'
),
(
    (SELECT id FROM categories WHERE name = 'sauce'),
    'Lemon Dill Sauce',
    'homemade',
    NULL,
    'A fresh, tangy sauce that pairs well with fish or vegetables.',
    '1/3 cup plain Greek yogurt
2 tbsp mayonnaise
1 1/2 tbsp chopped dill
2 tbsp lemon juice
1 tsp lemon zest
1 tsp garlic powder
salt and pepper to taste',
    'Combine all ingredients in a bowl.
Stir until smooth.
Taste and adjust seasoning.
Chill until ready to serve.',
    'sauce
lemon
dill'
),
(
    (SELECT id FROM categories WHERE name = 'sauce'),
    'Caramel Sauce',
    'homemade',
    NULL,
    'Use as a topping for desserts or fruit.',
    '1 cup brown sugar
1/2 cup butter
1/3 cup corn syrup
1 tsp vanilla',
    'Combine brown sugar, butter, and corn syrup in a saucepan.
Bring to a boil and boil for 1 minute.
Remove from heat and stir in vanilla.
Cool slightly before serving.',
    'sauce
caramel
dessert topping'
);

COMMIT;
