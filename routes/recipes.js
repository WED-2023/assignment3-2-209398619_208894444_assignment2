const express = require("express");
const router = express.Router();
const {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  createPersonalRecipe,
  getPersonalRecipeDetails,
} = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");


/*-------------------------------------------------------------------------------------------*/

// 1) Random previews
// GET /recipes/random?number=3
router.get("/random", async (req, res, next) => {
  try {
    const count = parseInt(req.query.number, 10) || 3;
    const user_id = req.session?.user_id || null; // Get user_id if logged in
    const recipes = await getRandomRecipes(count, user_id);
    res.json({ recipes });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

// 2) Search previews
// GET /recipes/search?query=pasta&cuisine=Italian&number=5&sort=popularity
router.get("/search", async (req, res, next) => {
  try {
    const { query, cuisine, diet, intolerances } = req.query;
    const number = parseInt(req.query.number, 10) || 5;
    const sort   = req.query.sort || "popularity";

    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Missing `query` parameter" });
    }

    // 1.do the Spoonacular search
    const user_id = req.session?.user_id || null; // Get user_id if logged in
    const results = await searchRecipes({ query, cuisine, diet, intolerances, number, sort, user_id });

    // 2.record it in last_search if the user is logged in
    if (req.session && req.session.user_id) {
      await require("./utils/user_utils").upsertLastSearch(
        req.session.user_id,
        { query, number, cuisine, diet, intolerances }
      );
    }

    // 3.return bigger payload
    res.json({
      recipes: results,
      totalResults: results.length,
      lastSearch:   query
    });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

// 3) Full details by ID
// GET /recipes/:id - Can be numeric (external) or non-numeric (internal)
router.get("/:id", async (req, res, next) => {
  try {
    const recipeId = req.params.id;
    let recipe;

    // First, try to fetch from the local/personal database.
    // This assumes personal recipes might have non-numeric IDs, but will work even if they are numeric.
    const personalRecipe = await getPersonalRecipeDetails(recipeId);

    if (personalRecipe) {
      // If found, this is our recipe.
      recipe = personalRecipe;
    } else {
      // If not found locally, and if the ID is purely numeric, try Spoonacular.
      if (!/^\d+$/.test(recipeId)) {
        return res.status(404).send({ message: "Recipe not found." });
      }
      recipe = await getRecipeDetails(recipeId);
    }
    
    // Mark as viewed for logged-in users
    if (req.session && req.session.user_id) { 
      await user_utils.recordView(req.session.user_id, recipeId);
      recipe.viewed = true;
    }

    res.json(recipe);
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

// POST /recipes
router.post("/", async (req, res, next) => {
  try {
    // 1) grab the logged-in user's ID
    const user_id = req.session.user_id;
    if (!user_id) {
      return res.status(401).json({ message: "Please log in", success: false });
    }

    // 2) delegate to helper
    //    req.body should be:
    //    { title, image, readyInMinutes, vegan, vegetarian, glutenFree,
    //      servings, instructions, ingredients: [ {name,amount,unit}, … ] }
    const newRecipeId = await createPersonalRecipe(req.body, user_id);

    // 3) respond with the new ID
    res.status(201).json({
      recipe_id: newRecipeId,
      message:   "Recipe created successfully",
      success:   true
    });
  }
  catch (err) {
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

// PUT /recipes/:id/servings
router.put("/:id/servings", async (req, res, next) => {
  try {
    const userId   = req.session.user_id;
    const recipeId = parseInt(req.params.id, 10);
    const { servings } = req.body;

    if (!servings || typeof servings !== "number" || servings <= 0) {
      return res.status(400).json({ error: "Invalid `servings` value" });
    }

    const newIngredients = await recipes_utils.updateServings(
      recipeId,
      servings,
      userId
    );
    res.json({
      message:     "Servings updated successfully",
      ingredients: newIngredients
    });
  }
  catch (err) {
    next(err);
  }
});


/*-------------------------------------------------------------------------------------------*/
module.exports = router;
