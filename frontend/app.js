// ---------------------------------------------------------------
// Personal Recipe Archive — frontend logic
// Talks to the Spring Boot API at API_BASE_URL for search, category
// filtering, and (later) the admin edit features.
// ---------------------------------------------------------------

const API_BASE_URL = "http://localhost:8080/api/recipes";

document.addEventListener("DOMContentLoaded", () => {
    const statusIndicator = document.getElementById("connection-status");
    const recipeContainer = document.getElementById("recipe-container");
    const searchBar = document.getElementById("search-bar");
    const filterChips = document.querySelectorAll(".filter-chip");

    let activeCategory = "all";
    let searchDebounceTimer;

    // Load everything once the page is ready
    fetchRecipes();

    // Search bar: wait 300ms after typing stops before hitting the API,
    // so we're not firing a request on every single keystroke.
    searchBar.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(fetchRecipes, 300);
    });

    // Category chips
    filterChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            filterChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            activeCategory = chip.dataset.category;

            // A search term and a category filter together would need
            // backend support we haven't built yet, so picking a category
            // clears any active search to avoid a confusing combination.
            searchBar.value = "";

            fetchRecipes();
        });
    });

    function buildRequestUrl() {
        const params = new URLSearchParams();
        const searchTerm = searchBar.value.trim();

        if (searchTerm) {
            params.set("search", searchTerm);
        } else if (activeCategory !== "all") {
            params.set("category", activeCategory);
        }

        const queryString = params.toString();
        return queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    }

    function fetchRecipes() {
        statusIndicator.innerText = "Loading recipes...";
        statusIndicator.style.color = "";

        fetch(buildRequestUrl())
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
                return response.json();
            })
            .then((recipes) => {
                renderRecipes(recipes);
                statusIndicator.innerText = `Connected — ${recipes.length} recipe(s) found.`;
                statusIndicator.style.color = "green";
                statusIndicator.style.fontWeight = "bold";
            })
            .catch((error) => {
                console.error("Failed to fetch recipes:", error);
                recipeContainer.innerHTML = "";
                statusIndicator.innerText =
                    "Could not connect to the backend. Is it running on port 8080?";
                statusIndicator.style.color = "red";
                statusIndicator.style.fontWeight = "bold";
            });
    }

    function renderRecipes(recipes) {
        recipeContainer.innerHTML = "";

        if (recipes.length === 0) {
            recipeContainer.innerHTML = `<p>No recipes found.</p>`;
            return;
        }

        recipes.forEach((recipe) => {
            const card = document.createElement("article");
            card.className = "recipe-card";
            card.innerHTML = `
                <h3>${escapeHtml(recipe.title)}</h3>
                <p class="recipe-category">${escapeHtml(recipe.category ? recipe.category.name : "")}</p>
                <p class="recipe-description">${escapeHtml(buildPreviewText(recipe))}</p>
                <a href="#" class="view-recipe-btn" data-id="${recipe.id}">View Details</a>
            `;
            recipeContainer.appendChild(card);
        });

        // Detail-view click handling comes in the next step — for now
        // this just proves the id is available on each card.
        document.querySelectorAll(".view-recipe-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                console.log("Recipe id clicked:", btn.dataset.id);
            });
        });
    }

    function buildPreviewText(recipe) {
        if (recipe.sourceType === "external") {
            return "External recipe — tap to view source.";
        }
        if (recipe.ingredients) {
            return recipe.ingredients.length > 80
                ? recipe.ingredients.slice(0, 80) + "..."
                : recipe.ingredients;
        }
        return "";
    }

    // Basic protection against rendering raw HTML from recipe data
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }
});
