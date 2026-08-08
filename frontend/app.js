// ---------------------------------------------------------------
// Personal Recipe Archive — frontend logic
// Handles search/filter, the read-only detail view, and the
// password-gated admin editing UI (add / edit / delete recipes).
// ---------------------------------------------------------------

const API_ROOT = "http://localhost:8080/api";
const RECIPES_URL = `${API_ROOT}/recipes`;
const CATEGORIES_URL = `${API_ROOT}/categories`;
const ADMIN_VALIDATE_URL = `${API_ROOT}/admin/validate`;

document.addEventListener("DOMContentLoaded", () => {
    // ----- Shared / list view elements -----
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

    // ----- Admin elements -----
    const editModeBtn = document.getElementById("edit-mode-btn");
    const exitEditBtns = document.querySelectorAll(".exit-edit-btn");

    const adminLogin = document.getElementById("admin-login");
    const adminPasswordInput = document.getElementById("admin-password-input");
    const adminSubmitBtn = document.getElementById("admin-submit-btn");
    const adminLoginError = document.getElementById("admin-login-error");

    const adminPanel = document.getElementById("admin-panel");
    const addRecipeBtn = document.getElementById("add-recipe-btn");
    const adminRecipeList = document.getElementById("admin-recipe-list");

    const adminForm = document.getElementById("admin-form");
    const adminFormHeading = document.getElementById("admin-form-heading");
    const formTitle = document.getElementById("form-title");
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

    // ----- State -----
    let activeCategory = "all";
    let searchDebounceTimer;
    let adminPassword = null;      // set once the password is validated
    let editingRecipeId = null;    // null = "add new", otherwise = "editing this id"
    let categoriesCache = null;    // cached after first fetch

    // =================================================================
    // Public list view (unchanged behavior from before)
    // =================================================================

    fetchRecipes();

    searchBar.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(fetchRecipes, 300);
    });

    filterChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            filterChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            activeCategory = chip.dataset.category;
            searchBar.value = "";
            fetchRecipes();
        });
    });

    backBtn.addEventListener("click", showListView);

    function buildRequestUrl() {
        const params = new URLSearchParams();
        const searchTerm = searchBar.value.trim();

        if (searchTerm) {
            params.set("search", searchTerm);
        } else if (activeCategory !== "all") {
            params.set("category", activeCategory);
        }

        const queryString = params.toString();
        return queryString ? `${RECIPES_URL}?${queryString}` : RECIPES_URL;
    }

    function fetchRecipes() {
        statusIndicator.innerText = "Loading recipes...";
        statusIndicator.style.color = "";

        fetch(buildRequestUrl())
            .then((response) => {
                if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
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
                statusIndicator.innerText = "Could not connect to the backend. Is it running on port 8080?";
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

    function buildPreviewText(recipe) {
        if (recipe.sourceType === "external") return "External recipe — tap to view source.";
        if (recipe.ingredients) {
            return recipe.ingredients.length > 80 ? recipe.ingredients.slice(0, 80) + "..." : recipe.ingredients;
        }
        return "";
    }

    // =================================================================
    // Read-only detail view
    // =================================================================

    function openRecipeDetail(id) {
        statusIndicator.innerText = "Loading recipe...";

        fetch(`${RECIPES_URL}/${id}`)
            .then((response) => {
                if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
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

    function splitList(text) {
        if (!text) return [];
        let items = text.split("\n").map((s) => s.trim()).filter(Boolean);
        if (items.length <= 1) {
            items = text.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return items;
    }

    // =================================================================
    // View switching (list / detail / admin-login / admin-panel / admin-form)
    // =================================================================

    function hideAllViews() {
        listView.classList.add("hidden");
        recipeDetail.classList.add("hidden");
        adminLogin.classList.add("hidden");
        adminPanel.classList.add("hidden");
        adminForm.classList.add("hidden");
    }

    function showListView() {
        hideAllViews();
        listView.classList.remove("hidden");
    }

    function showDetailView() {
        hideAllViews();
        recipeDetail.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    function showAdminLogin() {
        hideAllViews();
        adminLoginError.classList.add("hidden");
        adminPasswordInput.value = "";
        adminLogin.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    function showAdminPanel() {
        hideAllViews();
        adminPanel.classList.remove("hidden");
        window.scrollTo(0, 0);
        loadAdminRecipeList();
    }

    function showAdminForm() {
        hideAllViews();
        adminForm.classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    // =================================================================
    // Admin: entering / exiting edit mode
    // =================================================================

    editModeBtn.addEventListener("click", showAdminLogin);

    exitEditBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            adminPassword = null;
            editingRecipeId = null;
            fetchRecipes(); // refresh public list in case admin made changes
            showListView();
        });
    });

    adminSubmitBtn.addEventListener("click", () => {
        const attemptedPassword = adminPasswordInput.value;

        fetch(ADMIN_VALIDATE_URL, {
            method: "POST",
            headers: { "X-Admin-Password": attemptedPassword },
        })
            .then((response) => {
                if (!response.ok) throw new Error("Invalid password");
                adminPassword = attemptedPassword;
                showAdminPanel();
            })
            .catch(() => {
                adminLoginError.classList.remove("hidden");
            });
    });

    // =================================================================
    // Admin: recipe management list
    // =================================================================

    function loadAdminRecipeList() {
        adminRecipeList.innerHTML = "<p>Loading...</p>";

        fetch(RECIPES_URL)
            .then((response) => response.json())
            .then((recipes) => {
                adminRecipeList.innerHTML = "";
                if (recipes.length === 0) {
                    adminRecipeList.innerHTML = "<p>No recipes yet.</p>";
                    return;
                }
                recipes.forEach((recipe) => {
                    const row = document.createElement("div");
                    row.className = "admin-recipe-row";
                    row.innerHTML = `
                        <span>${escapeHtml(recipe.title)}</span>
                        <button class="admin-edit-link" data-id="${recipe.id}">edit/delete</button>
                    `;
                    adminRecipeList.appendChild(row);
                });

                document.querySelectorAll(".admin-edit-link").forEach((btn) => {
                    btn.addEventListener("click", () => openAdminForm(btn.dataset.id));
                });
            })
            .catch((error) => {
                console.error("Failed to load admin recipe list:", error);
                adminRecipeList.innerHTML = "<p>Could not load recipes.</p>";
            });
    }

    addRecipeBtn.addEventListener("click", () => openAdminForm(null));

    // =================================================================
    // Admin: add / edit form
    // =================================================================

    function loadCategoriesIntoDropdown(selectedCategoryId) {
        const populate = (categories) => {
            formCategory.innerHTML = "";
            categories.forEach((cat) => {
                const opt = document.createElement("option");
                opt.value = cat.id;
                opt.textContent = cat.name;
                if (selectedCategoryId && String(cat.id) === String(selectedCategoryId)) {
                    opt.selected = true;
                }
                formCategory.appendChild(opt);
            });
        };

        if (categoriesCache) {
            populate(categoriesCache);
            return Promise.resolve();
        }

        return fetch(CATEGORIES_URL)
            .then((response) => response.json())
            .then((categories) => {
                categoriesCache = categories;
                populate(categories);
            });
    }

    function toggleUrlFieldVisibility() {
        const isExternal = formSourceType.value === "external";
        formUrlLabel.classList.toggle("hidden", !isExternal);
        formUrl.classList.toggle("hidden", !isExternal);
    }

    formSourceType.addEventListener("change", toggleUrlFieldVisibility);

    function openAdminForm(recipeId) {
        adminFormError.classList.add("hidden");
        editingRecipeId = recipeId;

        if (recipeId === null) {
            // "Add new recipe" — start with a blank form
            adminFormHeading.textContent = "Add New Recipe";
            formTitle.value = "";
            formSourceType.value = "homemade";
            formUrl.value = "";
            formIngredients.value = "";
            formSteps.value = "";
            formTags.value = "";
            formDeleteBtn.classList.add("hidden");
            loadCategoriesIntoDropdown(null).then(() => {
                toggleUrlFieldVisibility();
                showAdminForm();
            });
            return;
        }

        // Editing an existing recipe — fetch its current data first
        fetch(`${RECIPES_URL}/${recipeId}`)
            .then((response) => response.json())
            .then((recipe) => {
                adminFormHeading.textContent = "Edit Recipe";
                formTitle.value = recipe.title || "";
                formSourceType.value = recipe.sourceType || "homemade";
                formUrl.value = recipe.url || "";
                formIngredients.value = recipe.ingredients || "";
                formSteps.value = recipe.steps || "";
                formTags.value = recipe.tags || "";
                formDeleteBtn.classList.remove("hidden");

                return loadCategoriesIntoDropdown(recipe.category ? recipe.category.id : null);
            })
            .then(() => {
                toggleUrlFieldVisibility();
                showAdminForm();
            })
            .catch((error) => {
                console.error("Failed to load recipe for editing:", error);
            });
    }

    formCancelBtn.addEventListener("click", showAdminPanel);

    formSaveBtn.addEventListener("click", () => {
        adminFormError.classList.add("hidden");

        const payload = {
            title: formTitle.value.trim(),
            sourceType: formSourceType.value,
            url: formSourceType.value === "external" ? formUrl.value.trim() : null,
            ingredients: formIngredients.value.trim(),
            steps: formSteps.value.trim(),
            tags: formTags.value.trim(),
            categoryId: Number(formCategory.value),
        };

        if (!payload.title) {
            showFormError("Title is required.");
            return;
        }

        const isEditing = editingRecipeId !== null;
        const url = isEditing ? `${RECIPES_URL}/${editingRecipeId}` : RECIPES_URL;
        const method = isEditing ? "PUT" : "POST";

        fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "X-Admin-Password": adminPassword,
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (response.status === 401) {
                    // Session-equivalent expired/invalid — send them back to login
                    adminPassword = null;
                    showAdminLogin();
                    throw new Error("Unauthorized");
                }
                if (!response.ok) {
                    return response.text().then((msg) => {
                        throw new Error(msg || `Save failed (status ${response.status})`);
                    });
                }
                return response.json();
            })
            .then(() => {
                showAdminPanel();
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showFormError(error.message);
                }
            });
    });

    formDeleteBtn.addEventListener("click", () => {
        if (editingRecipeId === null) return;
        const confirmed = window.confirm("Delete this recipe? This cannot be undone.");
        if (!confirmed) return;

        fetch(`${RECIPES_URL}/${editingRecipeId}`, {
            method: "DELETE",
            headers: { "X-Admin-Password": adminPassword },
        })
            .then((response) => {
                if (response.status === 401) {
                    adminPassword = null;
                    showAdminLogin();
                    throw new Error("Unauthorized");
                }
                if (!response.ok && response.status !== 204) {
                    throw new Error(`Delete failed (status ${response.status})`);
                }
                showAdminPanel();
            })
            .catch((error) => {
                if (error.message !== "Unauthorized") {
                    showFormError(error.message);
                }
            });
    });

    function showFormError(message) {
        adminFormError.textContent = message;
        adminFormError.classList.remove("hidden");
    }

    // =================================================================
    // Shared helper
    // =================================================================

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }
});
