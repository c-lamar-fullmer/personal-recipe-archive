// ---------------------------------------------------------------
// Personal Recipe Archive — frontend logic
// Handles search/filter, the read-only detail view, and the
// password-gated admin editing UI (add / edit / delete recipes).
// ---------------------------------------------------------------

// Base URL for all requests to the Spring Boot backend.
const API_ROOT = "http://localhost:8080/api";

// Build specific API URLs from the base URL.
// Using constants prevents us from having to repeatedly type the full URL.
const RECIPES_URL = `${API_ROOT}/recipes`;
const CATEGORIES_URL = `${API_ROOT}/categories`;
const ADMIN_VALIDATE_URL = `${API_ROOT}/admin/validate`;

// Static content — no reason for this to live in the backend since it
// never changes at runtime and the admin panel has no need to edit it.
// This is an array containing the quotes that can be displayed.
const MOTIVATIONAL_QUOTES = [
    "If it tastes good, nobody needs to know what happened in the kitchen.",
    "When in doubt, add garlic. When still in doubt, add more garlic.",
    "Tonight's special: whatever is about to expire in the fridge.",
    "The secret ingredient is pretending you know what you're doing.",
    "I don't need a recipe. I need confidence.",
    "If nobody saw you burn it, did it really happen?",
    "I don't always know what I'm doing, but I usually add salt.",
    "Nobody said dessert had to be shared.",
    "Nobody starts out knowing what they're doing. That's what recipes are for.",
    "Every good cook has made something terrible. Keep cooking.",
    "The best way to get better at cooking is to keep cooking.",
];

// 60 seconds × 1000 milliseconds = 60,000 milliseconds = 1 minute.
// This determines how often the motivational quote changes.
const QUOTE_ROTATION_INTERVAL_MS = 60 * 1000;


// Wait until the HTML document has completely loaded before running
// JavaScript that needs to access elements from the page.
document.addEventListener("DOMContentLoaded", () => {

    // =============================================================
    // Motivational quote rotation
    // =============================================================

    // Find the HTML element where the quote will be displayed.
    const quoteElement = document.getElementById("motivational-quote");

    // Math.random() generates a random number between 0 and 1.
    // Multiplying by the array length gives us a random position.
    // Math.floor() removes the decimal portion to create an integer.
    //
    // Example: if the array has 11 quotes, this produces a number
    // from 0 through 10.
    let quoteIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);

    // Function that displays the current quote and then moves
    // quoteIndex to the next quote.
    function showNextQuote() {

        // textContent changes the text inside the HTML element.
        quoteElement.textContent = MOTIVATIONAL_QUOTES[quoteIndex];

        // Move to the next quote.
        // The % operator makes the index return to 0 after reaching
        // the final quote.
        //
        // Example: (10 + 1) % 11 = 0
        quoteIndex = (quoteIndex + 1) % MOTIVATIONAL_QUOTES.length;
    }

    // Display the first quote immediately when the page loads.
    showNextQuote();

    // Run showNextQuote() every 60 seconds.
    setInterval(showNextQuote, QUOTE_ROTATION_INTERVAL_MS);


    // =============================================================
    // Shared / list view elements
    // =============================================================

    // Get references to HTML elements so JavaScript can manipulate them.
    // These variables store the actual DOM elements.
    const mainHeader = document.getElementById("main-header");
    const mainFooter = document.getElementById("main-footer");
    const statusIndicator = document.getElementById("connection-status");
    const recipeContainer = document.getElementById("recipe-container");
    const searchBar = document.getElementById("search-bar");

    // querySelectorAll() returns every element matching the CSS selector.
    // Here, it finds all buttons with class="filter-chip".
    const filterChips = document.querySelectorAll(".filter-chip");

    // Elements used for switching between the recipe list and
    // individual recipe detail screen.
    const listView = document.getElementById("list-view");
    const recipeDetail = document.getElementById("recipe-detail");
    const backBtn = document.getElementById("back-btn");
    const detailTitle = document.getElementById("detail-title");
    const detailNotesBlock = document.getElementById("detail-notes-block");
    const detailNotes = document.getElementById("detail-notes");
    const detailIngredients = document.getElementById("detail-ingredients");
    const detailSteps = document.getElementById("detail-steps");
    const detailTags = document.getElementById("detail-tags");
    const detailUrlBlock = document.getElementById("detail-url-block");
    const detailUrl = document.getElementById("detail-url");


    // =============================================================
    // Admin elements
    // =============================================================

    // Get references to the buttons and sections used by admin mode.
    const editModeBtn = document.getElementById("edit-mode-btn");
    const exitEditBtns = document.querySelectorAll(".exit-edit-btn");

    // Admin login elements.
    const adminLogin = document.getElementById("admin-login");
    const adminPasswordInput = document.getElementById("admin-password-input");
    const adminSubmitBtn = document.getElementById("admin-submit-btn");
    const adminLoginError = document.getElementById("admin-login-error");

    // Admin recipe list elements.
    const adminPanel = document.getElementById("admin-panel");
    const addRecipeBtn = document.getElementById("add-recipe-btn");
    const adminRecipeList = document.getElementById("admin-recipe-list");

    // Admin add/edit form elements.
    const adminForm = document.getElementById("admin-form");
    const adminFormHeading = document.getElementById("admin-form-heading");
    const formTitle = document.getElementById("form-title");
    const formNotes = document.getElementById("form-notes");
    const formCategory = document.getElementById("form-category");
    const formSourceType = document.getElementById("form-source-type");
    const formUrlLabel = document.getElementById("form-url-label");
    const formUrl = document.getElementById("form-url");
    const formIngredients = document.getElementById("form-ingredients");
    const formSteps = document.getElementById("form-steps");
    const formTags = document.getElementById("form-tags");
    const adminFormError = document.getElementById("admin-form-error");
    const formSaveBtn = document.getElementById("form-save-btn");
    const formCancelBtn = document.getElementById("form-cancel-btn");
    const formDeleteBtn = document.getElementById("form-delete-btn");


    // =============================================================
    // State
    // =============================================================

    // These variables remember information about what the user is
    // currently doing while the page is running.

    // Which category is currently selected.
    let activeCategory = "all";

    // Stores the timer used to delay search requests.
    // This prevents a request from being sent for every single
    // character the user types.
    let searchDebounceTimer;

    // Stores the admin password after successful authentication.
    // null means the user is not currently authenticated.
    let adminPassword = null;

    // Stores the ID of the recipe currently being edited.
    // null means we are creating a new recipe instead.
    let editingRecipeId = null;

    // Stores categories after they have been loaded once.
    // This prevents repeatedly requesting the same categories.
    let categoriesCache = null;


    // =============================================================
    // Public list view
    // =============================================================

    // Load recipes as soon as the page is ready.
    fetchRecipes();

    // Listen for changes to the search box.
    searchBar.addEventListener("input", () => {

        // Cancel the previous timer if the user is still typing.
        clearTimeout(searchDebounceTimer);

        // Wait 300 milliseconds before searching.
        // This is called "debouncing" and prevents excessive API requests.
        searchDebounceTimer = setTimeout(fetchRecipes, 300);
    });


    // Add a click event listener to every category filter button.
    filterChips.forEach((chip) => {

        chip.addEventListener("click", () => {

            // Remove "active" from every category button.
            filterChips.forEach((c) => c.classList.remove("active"));

            // Add "active" to the button the user clicked.
            chip.classList.add("active");

            // data-category comes from the HTML attribute:
            // data-category="dessert", for example.
            chip.dataset.category;

            // Store the selected category in our state variable.
            activeCategory = chip.dataset.category;

            // Search is intentionally left as-is here — picking a category
            // should narrow the current search, not erase it.
            fetchRecipes();
        });
    });


    // When the X button is clicked, return to the recipe list.
    backBtn.addEventListener("click", showListView);


    // =============================================================
    // Build API request URL
    // =============================================================

    function buildRequestUrl() {

        // URLSearchParams helps safely construct URL query parameters.
        const params = new URLSearchParams();

        // Get the search text and remove whitespace from the beginning
        // and end using trim().
        const searchTerm = searchBar.value.trim();

        // Both search and category can be used at the same time.
        if (searchTerm) {
            params.set("search", searchTerm);
        }

        // "all" means no category filter should be sent to the backend.
        if (activeCategory !== "all") {
            params.set("category", activeCategory);
        }

        // Convert the parameters into a URL query string.
        //
        // Example:
        // search=chicken&category=main+course
        const queryString = params.toString();

        // If parameters exist, add ? followed by the query string.
        // Otherwise, just return the normal recipes URL.
        return queryString ? `${RECIPES_URL}?${queryString}` : RECIPES_URL;
    }


    // =============================================================
    // Fetch recipes from backend
    // =============================================================

    function fetchRecipes() {

        // Clear any previous connection message.
        statusIndicator.textContent = "";

        // fetch() sends an HTTP request to the Spring Boot backend.
        fetch(buildRequestUrl())

            // The first .then() receives the HTTP response.
            .then((response) => {

                // response.ok is true for successful HTTP responses.
                // If the server returns an error status, throw an Error.
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }

                // Convert the JSON response into a JavaScript object/array.
                return response.json();
            })

            // The second .then() receives the parsed recipe data.
            .then((recipes) => {

                // Display the recipes on the page.
                renderRecipes(recipes);

                // Clear the connection status.
                statusIndicator.textContent = "";
            })

            // catch() handles errors from the request or previous .then().
            .catch((error) => {

                // Print the technical error to the browser console.
                console.error("Failed to fetch recipes:", error);

                // Clear any existing recipe cards.
                recipeContainer.innerHTML = "";

                // Show a user-friendly error message.
                statusIndicator.textContent =
                    "Could not connect to the backend. Is it running on port 8080?";

                statusIndicator.style.color = "red";
                statusIndicator.style.fontWeight = "bold";
            });
    }


    // =============================================================
    // Display recipe cards
    // =============================================================

    function renderRecipes(recipes) {

        // Clear the existing recipe cards before displaying new ones.
        recipeContainer.innerHTML = "";

        // If the backend returned an empty array, display a message.
        if (recipes.length === 0) {
            recipeContainer.innerHTML = `<p>No recipes found.</p>`;
            return;
        }

        // forEach() runs the following function once for every recipe.
        recipes.forEach((recipe) => {

            // Create a new <article> element.
            const card = document.createElement("article");

            // Give the new element the CSS class "recipe-card".
            card.className = "recipe-card";

            // Add the recipe information inside the card.
            // ${...} inserts JavaScript values into the template string.
            card.innerHTML = `
                <h3>${escapeHtml(recipe.title)}</h3>
                <p class="recipe-category">${escapeHtml(recipe.category ? recipe.category.name : "")}</p>
                <p class="recipe-description">${escapeHtml(buildPreviewText(recipe))}</p>
                <a href="#" class="view-recipe-btn" data-id="${recipe.id}">View Details</a>
            `;

            // Add the completed card to the recipe container.
            recipeContainer.appendChild(card);
        });


        // Find all "View Details" buttons that were just created.
        document.querySelectorAll(".view-recipe-btn").forEach((btn) => {

            // Add a click listener to each button.
            btn.addEventListener("click", (e) => {

                // Prevent the <a href="#"> link from changing the page URL.
                e.preventDefault();

                // Read the recipe ID from data-id and open that recipe.
                openRecipeDetail(btn.dataset.id);
            });
        });
    }


    // =============================================================
    // Build recipe preview text
    // =============================================================

    function buildPreviewText(recipe) {

        // External recipes don't have their own ingredients/steps
        // displayed in the card preview.
        if (recipe.sourceType === "external") {
            return "External recipe — tap to view source.";
        }

        // If ingredients exist, use them as the preview.
        if (recipe.ingredients) {

            // Limit the preview to 80 characters.
            // This keeps recipe cards from becoming too large.
            return recipe.ingredients.length > 80
                ? recipe.ingredients.slice(0, 80) + "..."
                : recipe.ingredients;
        }

        // If there is no preview text, return an empty string.
        return "";
    }


    // =============================================================
    // Read-only detail view
    // =============================================================

    function openRecipeDetail(id) {

        statusIndicator.textContent = "";

        // Request one specific recipe using its ID.
        fetch(`${RECIPES_URL}/${id}`)

            .then((response) => {

                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }

                return response.json();
            })

            .then((recipe) => {

                // Put the recipe information into the detail page.
                renderRecipeDetail(recipe);

                // Switch from the list screen to the detail screen.
                showDetailView();
            })

            .catch((error) => {

                console.error("Failed to fetch recipe details:", error);

                statusIndicator.textContent = "Could not load that recipe.";
                statusIndicator.style.color = "red";
            });
    }


    // =============================================================
    // Fill the detail view with recipe information
    // =============================================================

    function renderRecipeDetail(recipe) {

        // Display the recipe title.
        detailTitle.textContent = recipe.title || "";

        // Only display the Notes section if notes actually exist.
        if (recipe.notes && recipe.notes.trim()) {

            detailNotes.textContent = recipe.notes;
            detailNotesBlock.classList.remove("hidden");

        } else {

            // Hide the Notes section when there are no notes.
            detailNotesBlock.classList.add("hidden");
        }

        // Convert ingredients and steps from strings into list items.
        renderListItems(detailIngredients, splitList(recipe.ingredients));
        renderListItems(detailSteps, splitList(recipe.steps));

        // Convert tags into an array.
        const tags = splitList(recipe.tags);

        // Display tags separated by commas.
        // If there are no tags, display "No tags".
        detailTags.textContent =
            tags.length > 0 ? tags.join(", ") : "No tags";


        // Only display the external URL when this is an external recipe
        // and a URL was actually provided.
        if (recipe.sourceType === "external" && recipe.url) {

            detailUrl.href = recipe.url;
            detailUrl.textContent = recipe.url;
            detailUrlBlock.classList.remove("hidden");

        } else {

            detailUrlBlock.classList.add("hidden");
        }
    }


    // =============================================================
    // Create HTML list items
    // =============================================================

    function renderListItems(listEl, items) {

        // Remove any existing list items.
        listEl.innerHTML = "";

        // If there are no items, display a placeholder.
        if (items.length === 0) {
            listEl.innerHTML = "<li>None listed</li>";
            return;
        }

        // Create one <li> element for every item.
        items.forEach((item) => {

            const li = document.createElement("li");

            // textContent adds the text safely without interpreting
            // the value as HTML.
            li.textContent = item;

            // Add the <li> to the list.
            listEl.appendChild(li);
        });
    }


    // =============================================================
    // Convert stored text into an array
    // =============================================================

    function splitList(text) {

        // If the value is null, undefined, or empty, return an empty array.
        if (!text) return [];

        // First try splitting the text by line breaks.
        //
        // map() removes whitespace from each item.
        // filter(Boolean) removes empty items.
        let items = text
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);

        // If there was only one line, try commas instead.
        // This allows the database to contain either:
        //
        // flour
        // sugar
        //
        // OR:
        //
        // flour, sugar
        if (items.length <= 1) {
            items = text
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        return items;
    }


    // =============================================================
    // View switching
    // =============================================================

    // Hide every major section.
    // Then individual functions show only the section they need.
    function hideAllViews() {

        listView.classList.add("hidden");
        recipeDetail.classList.add("hidden");
        adminLogin.classList.add("hidden");
        adminPanel.classList.add("hidden");
        adminForm.classList.add("hidden");

        // Hide the Edit Recipes button by default.
        editModeBtn.classList.add("hidden");
    }


    // Display the normal public recipe list.
    function showListView() {

        hideAllViews();

        listView.classList.remove("hidden");
        editModeBtn.classList.remove("hidden");

        // The header and footer are visible on the main recipe list.
        mainHeader.classList.remove("hidden");
        mainFooter.classList.remove("hidden");
    }


    // Display a single recipe.
    function showDetailView() {

        hideAllViews();

        recipeDetail.classList.remove("hidden");

        // Scroll to the top of the page.
        window.scrollTo(0, 0);

        // Hide the header/footer to give the recipe more screen space.
        mainHeader.classList.add("hidden");
        mainFooter.classList.add("hidden");
    }


    // Display the admin password screen.
    function showAdminLogin() {

        hideAllViews();

        // Hide any previous password error.
        adminLoginError.classList.add("hidden");

        // Clear the password field.
        adminPasswordInput.value = "";

        adminLogin.classList.remove("hidden");

        window.scrollTo(0, 0);
    }


    // Display the admin recipe management panel.
    function showAdminPanel() {

        hideAllViews();

        adminPanel.classList.remove("hidden");

        window.scrollTo(0, 0);

        // Load the current recipes into the admin list.
        loadAdminRecipeList();
    }


    // Display the add/edit recipe form.
    function showAdminForm() {

        hideAllViews();

        adminForm.classList.remove("hidden");

        window.scrollTo(0, 0);
    }


    // =============================================================
    // Admin: entering / exiting edit mode
    // =============================================================

    // Clicking "Edit Recipes" opens the admin login screen.
    editModeBtn.addEventListener("click", showAdminLogin);


    // Add an exit handler to every "Exit Editing Mode" button.
    exitEditBtns.forEach((btn) => {

        btn.addEventListener("click", () => {

            // Remove the stored password.
            // This means the user must authenticate again next time.
            adminPassword = null;

            // Clear the recipe being edited.
            editingRecipeId = null;

            // Refresh the public recipe list.
            fetchRecipes();

            // Return to the public list view.
            showListView();
        });
    });


    // =============================================================
    // Admin: password validation
    // =============================================================

    adminSubmitBtn.addEventListener("click", () => {

        // Get the password entered by the user.
        const attemptedPassword = adminPasswordInput.value;

        // Send the password to the backend for validation.
        fetch(ADMIN_VALIDATE_URL, {
            method: "POST",

            // Send the password using a custom HTTP header.
            headers: {
                "X-Admin-Password": attemptedPassword
            },
        })

            .then((response) => {

                // A non-2xx response means authentication failed.
                if (!response.ok) {
                    throw new Error("Invalid password");
                }

                // Save the password so it can be sent with future
                // add/edit/delete requests.
                adminPassword = attemptedPassword;

                // Authentication succeeded — show the admin panel.
                showAdminPanel();
            })

            .catch(() => {

                // Show an error message if authentication fails.
                adminLoginError.classList.remove("hidden");
            });
    });


    // =============================================================
    // Admin: recipe management list
    // =============================================================

    function loadAdminRecipeList() {

        // Display a temporary loading message.
        adminRecipeList.innerHTML = "<p>Loading...</p>";

        // Get all recipes from the backend.
        fetch(RECIPES_URL)

            .then((response) => response.json())

            .then((recipes) => {

                // Clear the loading message.
                adminRecipeList.innerHTML = "";

                // Handle an empty database.
                if (recipes.length === 0) {
                    adminRecipeList.innerHTML = "<p>No recipes yet.</p>";
                    return;
                }

                // Create one admin row for every recipe.
                recipes.forEach((recipe) => {

                    const row = document.createElement("div");
                    row.className = "admin-recipe-row";

                    row.innerHTML = `
                        <span>${escapeHtml(recipe.title)}</span>
                        <button class="admin-edit-link" data-id="${recipe.id}">edit/delete</button>
                    `;

                    adminRecipeList.appendChild(row);
                });


                // Find all edit/delete buttons that were just created.
                document.querySelectorAll(".admin-edit-link").forEach((btn) => {

                    btn.addEventListener("click", () => {

                        // Pass the recipe ID to the edit form.
                        openAdminForm(btn.dataset.id);
                    });
                });
            })

            .catch((error) => {

                console.error("Failed to load admin recipe list:", error);

                adminRecipeList.innerHTML = "<p>Could not load recipes.</p>";
            });
    }


    // Clicking "+ Add new recipe" opens the form with no recipe ID.
    // null tells openAdminForm() that this is a new recipe.
    addRecipeBtn.addEventListener("click", () => openAdminForm(null));


    // =============================================================
    // Admin: add / edit form
    // =============================================================

    // Load categories from the backend and put them into the dropdown.
    function loadCategoriesIntoDropdown(selectedCategoryId) {

        // This function fills the <select> element with category options.
        const populate = (categories) => {

            // Remove any existing options.
            formCategory.innerHTML = "";

            // Create one <option> for every category.
            categories.forEach((cat) => {

                const opt = document.createElement("option");

                // The option's value is the category database ID.
                opt.value = cat.id;

                // The text displayed to the user is the category name.
                opt.textContent = cat.name;

                // If editing, automatically select the recipe's
                // existing category.
                if (
                    selectedCategoryId &&
                    String(cat.id) === String(selectedCategoryId)
                ) {
                    opt.selected = true;
                }

                formCategory.appendChild(opt);
            });
        };


        // If categories have already been loaded, use the cached copy
        // instead of making another HTTP request.
        if (categoriesCache) {
            populate(categoriesCache);
            return Promise.resolve();
        }


        // Otherwise, request categories from the backend.
        return fetch(CATEGORIES_URL)

            .then((response) => response.json())

            .then((categories) => {

                // Save categories so future calls don't need another request.
                categoriesCache = categories;

                // Populate the dropdown.
                populate(categories);
            });
    }


    // Show or hide the URL field depending on the selected source type.
    function toggleUrlFieldVisibility() {

        // Check whether the user selected "external".
        const isExternal = formSourceType.value === "external";

        // If external, remove "hidden"; otherwise add "hidden".
        formUrlLabel.classList.toggle("hidden", !isExternal);
        formUrl.classList.toggle("hidden", !isExternal);
    }


    // Re-run the URL visibility function whenever the source selection changes.
    formSourceType.addEventListener("change", toggleUrlFieldVisibility);


    // Open the form for either creating or editing a recipe.
    function openAdminForm(recipeId) {

        // Hide any previous error message.
        adminFormError.classList.add("hidden");

        // Remember which recipe is being edited.
        editingRecipeId = recipeId;


        // =========================================================
        // Creating a new recipe
        // =========================================================

        if (recipeId === null) {

            adminFormHeading.textContent = "Add New Recipe";

            // Reset every form field.
            formTitle.value = "";
            formNotes.value = "";
            formSourceType.value = "homemade";
            formUrl.value = "";
            formIngredients.value = "";
            formSteps.value = "";
            formTags.value = "";

            // There is nothing to delete because this recipe doesn't
            // exist in the database yet.
            formDeleteBtn.classList.add("hidden");

            // Load categories and then display the form.
            loadCategoriesIntoDropdown(null).then(() => {

                toggleUrlFieldVisibility();
                showAdminForm();
            });

            return;
        }


        // =========================================================
        // Editing an existing recipe
        // =========================================================

        // Request the existing recipe from the backend.
        fetch(`${RECIPES_URL}/${recipeId}`)

            .then((response) => response.json())

            .then((recipe) => {

                // Change the form title to indicate editing.
                adminFormHeading.textContent = "Edit Recipe";

                // Fill the form with the existing recipe's values.
                formTitle.value = recipe.title || "";
                formNotes.value = recipe.notes || "";
                formSourceType.value = recipe.sourceType || "homemade";
                formUrl.value = recipe.url || "";
                formIngredients.value = recipe.ingredients || "";
                formSteps.value = recipe.steps || "";
                formTags.value = recipe.tags || "";

                // Show the delete button because this recipe already exists.
                formDeleteBtn.classList.remove("hidden");

                // Load categories and select the recipe's current category.
                return loadCategoriesIntoDropdown(
                    recipe.category ? recipe.category.id : null
                );
            })

            .then(() => {

                // Update URL field visibility after the form has been populated.
                toggleUrlFieldVisibility();

                // Finally show the form.
                showAdminForm();
            })

            .catch((error) => {

                console.error("Failed to load recipe for editing:", error);
            });
    }


    // Cancel returns to the admin recipe list.
    formCancelBtn.addEventListener("click", showAdminPanel);


    // =============================================================
    // Admin: save recipe
    // =============================================================

    formSaveBtn.addEventListener("click", () => {

        // Hide any previous error.
        adminFormError.classList.add("hidden");


        // Build an object containing the form data.
        // This object will eventually be converted into JSON.
        const payload = {
            title: formTitle.value.trim(),
            notes: formNotes.value.trim(),
            sourceType: formSourceType.value,

            // Only send a URL for external recipes.
            url: formSourceType.value === "external"
                ? formUrl.value.trim()
                : null,

            ingredients: formIngredients.value.trim(),
            steps: formSteps.value.trim(),
            tags: formTags.value.trim(),

            // Convert the selected category ID from a string to a number.
            categoryId: Number(formCategory.value),
        };


        // Basic client-side validation.
        // Don't send the request if there is no recipe title.
        if (!payload.title) {
            showFormError("Title is required.");
            return;
        }


        // Determine whether we are creating or editing.
        const isEditing = editingRecipeId !== null;

        // Editing uses /recipes/{id}; creating uses /recipes.
        const url = isEditing
            ? `${RECIPES_URL}/${editingRecipeId}`
            : RECIPES_URL;

        // Creating uses POST; editing uses PUT.
        const method = isEditing ? "PUT" : "POST";


        // Send the recipe to the backend.
        fetch(url, {
            method,

            // Tell Spring Boot that the request body contains JSON.
            headers: {
                "Content-Type": "application/json",

                // Include the authenticated admin password.
                "X-Admin-Password": adminPassword,
            },

            // Convert the JavaScript object into a JSON string.
            body: JSON.stringify(payload),
        })

            .then((response) => {

                // If authentication expired/failed, send the user
                // back to the login screen.
                if (response.status === 401) {

                    adminPassword = null;
                    showAdminLogin();

                    throw new Error("Unauthorized");
                }


                // Handle other HTTP errors.
                if (!response.ok) {

                    // Read the server's error message.
                    return response.text().then((msg) => {

                        throw new Error(
                            msg || `Save failed (status ${response.status})`
                        );
                    });
                }

                // Convert the successful response to JSON.
                return response.json();
            })

            .then(() => {

                // Saving succeeded — return to the admin recipe list.
                showAdminPanel();
            })

            .catch((error) => {

                // Don't display "Unauthorized" as a normal form error
                // because the user has already been sent to login.
                if (error.message !== "Unauthorized") {
                    showFormError(error.message);
                }
            });
    });


    // =============================================================
    // Admin: delete recipe
    // =============================================================

    formDeleteBtn.addEventListener("click", () => {

        // Safety check — don't attempt to delete a recipe if
        // there is no recipe ID.
        if (editingRecipeId === null) return;


        // Ask the user to confirm before deleting.
        const confirmed = window.confirm(
            "Delete this recipe? This cannot be undone."
        );

        // Stop if the user clicks Cancel.
        if (!confirmed) return;


        // Send a DELETE request to the backend.
        fetch(`${RECIPES_URL}/${editingRecipeId}`, {

            method: "DELETE",

            headers: {
                "X-Admin-Password": adminPassword
            },
        })

            .then((response) => {

                // Authentication failed.
                if (response.status === 401) {

                    adminPassword = null;
                    showAdminLogin();

                    throw new Error("Unauthorized");
                }


                // DELETE normally returns 204 No Content when successful.
                // Other error responses should be treated as failures.
                if (!response.ok && response.status !== 204) {
                    throw new Error(
                        `Delete failed (status ${response.status})`
                    );
                }

                // Deletion succeeded — return to the admin panel.
                showAdminPanel();
            })

            .catch((error) => {

                if (error.message !== "Unauthorized") {
                    showFormError(error.message);
                }
            });
    });


    // Display an error message underneath the admin form.
    function showFormError(message) {

        adminFormError.textContent = message;
        adminFormError.classList.remove("hidden");
    }


    // =============================================================
    // Shared helper
    // =============================================================

    // Prevent recipe text from being interpreted as HTML.
    //
    // Example:
    // If a recipe title contained "<script>...</script>",
    // this function converts it into harmless text instead of
    // allowing the browser to interpret it as HTML/JavaScript.
    function escapeHtml(str) {

        // Create a temporary <div> element.
        const div = document.createElement("div");

        // textContent treats the input strictly as text.
        div.textContent = str || "";

        // innerHTML returns the safely escaped version.
        return div.innerHTML;
    }
});