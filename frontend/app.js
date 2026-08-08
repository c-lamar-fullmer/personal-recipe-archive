// ---------------------------------------------------------------
// Personal Recipe Archive — frontend logic
// Talks to the Spring Boot API at API_BASE_URL for search, category
// filtering, and viewing recipe details. Admin editing comes next.
// ---------------------------------------------------------------

const API_BASE_URL = "http://localhost:8080/api/recipes";

document.addEventListener("DOMContentLoaded", () => {
    const statusIndicator = document.getElementById("connection-status");
    const recipeContainer = document.getElementById("recipe-container");
    const searchBar = document.getElementById("search-bar");
    const filterChips = document.querySelectorAll(".filter-chip");

    const listView = document.getElementById("list-view");
    const recipeDetail = document.getElementById("recipe-detail");
    const backBtn = document.getElementById("back-btn");
    const detailTitle = document.getElementById("detail-title");
    const detailIngredients = document.getElementById("detail-ingredients");
    const detailSteps = document.getElementById("detail-steps");
    const detailTags = document.getElementById("detail-tags");
    const detailUrlBlock = document.getElementById("detail-url-block");
    const detailUrl = document.getElementById("detail-url");

    let activeCategory = "all";
    let searchDebounceTimer;

    // Load everything once the page is ready
    fetchRecipes();

    // Search bar: wait 300ms after typing stops before hitting the API
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
            searchBar.value = "";
            fetchRecipes();
        });
    });

    // Back button returns from detail view to the list view
    backBtn.addEventListener("click", () => {
        showListView();
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

        document.querySelectorAll(".view-recipe-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                openRecipeDetail(btn.dataset.id);
            });
        });
    }

    // ------------------- Detail view -------------------

    function openRecipeDetail(id) {
        statusIndicator.innerText = "Loading recipe...";

        fetch(`${API_BASE_URL}/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
                return response.json();
            })
            .then((recipe) => {
                renderRecipeDetail(recipe);
                showDetailView();
                statusIndicator.innerText = "Connected.";
                statusIndicator.style.color = "green";
            })
            .catch((error) => {
                console.error("Failed to fetch recipe details:", error);
                statusIndicator.innerText = "Could not load that recipe.";
                statusIndicator.style.color = "red";
            });
    }

    function renderRecipeDetail(recipe) {
        detailTitle.textContent = recipe.title || "";

        renderListItems(detailIngredients, splitList(recipe.ingredients));
        renderListItems(detailSteps, splitList(recipe.steps));

        const tags = splitList(recipe.tags);
        detailTags.textContent = tags.length > 0 ? tags.join(", ") : "No tags";

        if (recipe.sourceType === "external" && recipe.url) {
            detailUrl.href = recipe.url;
            detailUrl.textContent = recipe.url;
            detailUrlBlock.classList.remove("hidden");
        } else {
            detailUrlBlock.classList.add("hidden");
        }
    }

    function renderListItems(listEl, items) {
        listEl.innerHTML = "";
        if (items.length === 0) {
            listEl.innerHTML = "<li>None listed</li>";
            return;
        }
        items.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            listEl.appendChild(li);
        });
    }

    // Splits on newlines first (the format the admin form uses).
    // Falls back to commas so older/manually-created test data
    // (e.g. "flour, milk, eggs") still displays as a clean list.
    function splitList(text) {
        if (!text) return [];
        let items = text.split("\n").map((s) => s.trim()).filter(Boolean);
        if (items.length <= 1) {
            items = text.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return items;
    }

    function showDetailView() {
        listView.classList.add("hidden");
        recipeDetail.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    function showListView() {
        recipeDetail.classList.add("hidden");
        listView.classList.remove("hidden");
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

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }
});
