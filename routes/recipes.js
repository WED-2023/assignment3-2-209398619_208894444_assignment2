const express = require("express");
const router = express.Router();
const {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  getRecipeInstructions,
} = require("./utils/recipes_utils");

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

    const results = await searchRecipes({ query, cuisine, diet, intolerances, number, sort });
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
    const recipe = await getRecipeDetails(req.params.id);
    res.json(recipe);
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

// POST /recipes
router.post("/", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;              // from your auth middleware
    const newId   = await recipes_utils.createPersonalRecipe(req.body, user_id);
    res.status(201).json({ id: newId, message: "Recipe created successfully" });
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
