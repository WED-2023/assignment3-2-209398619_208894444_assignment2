const express = require("express");
const router = express.Router();
const {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  createPersonalRecipe
} = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");


/*-------------------------------------------------------------------------------------------*/

// 1) Random previews
// GET /recipes/random?number=3
router.get("/random", async (req, res, next) => {
  try {
    const count = parseInt(req.query.number, 10) || 3;
    const recipes = await getRandomRecipes(count);
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
    const results = await searchRecipes({ query, cuisine, diet, intolerances, number, sort });

    // 2.record it in last_search if the user is logged in
    if (req.session && req.session.user_id) {
      await require("./utils/user_utils").upsertLastSearch(
        req.session.user_id,
        { query, number, cuisine, diet, intolerances }
      );
    }

    // 3.return bigger payload
    res.json({
      results,
      totalResults: results.length,
      lastSearch:   query
    });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

// 3) Full details by ID
// GET /recipes/:id
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    // 1) fetch the full details from Spoonacular
    const recipe = await getRecipeDetails(req.params.id);

    // 2) if the user is logged in, record the view & mark viewed
    if (req.session && req.session.user_id) { 
      await user_utils.recordView(req.session.user_id, req.params.id);
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
    // 1) grab the logged-in user’s ID
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
