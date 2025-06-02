// routes/user.js
const express       = require("express");
const router        = express.Router();
const user_utils    = require("./utils/user_utils");
const { get_last_three_views } = require("./utils/recipes_utils");
const family_utils = require("./utils/family_utils");

/*-------------------------------------------------------------------------------------------*/

/**
 * Auth middleware: require a valid session.user_id
 */
router.use((req, res, next) => {
  if (req.session && req.session.user_id) {
    req.user_id = req.session.user_id;
    next();
  }
  else {
    res.sendStatus(401);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * POST /users/favorites
 * Add a recipe to the logged‐in user’s favorites.
 * Body: { recipeId: <number> }
 */
router.post("/favorites", async (req, res, next) => {
  try {
    const user_id   = req.user_id;
    const recipe_id = parseInt(req.body.recipeId, 10);
    if (!recipe_id) {
      return res.status(400).json({ message: "Missing recipeId", success: false });
    }

    await user_utils.addFavoriteRecipe(user_id, recipe_id);
    return res.status(201).json({ message: "Recipe added to favorites", success: true });
  }
  catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ message: err.message, success: false });
    }
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/favorites
 * Return the list of RecipePreview objects the user has favorited.
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const user_id  = req.user_id;
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    res.json({ favorites });
  }
  catch (err) { next(err); }
});


/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/recipes
 * Return the list of personal recipes created by the user.
 */
router.get("/recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const recipes = await user_utils.getUserRecipes(user_id);
    res.json({ recipes });
  }
  catch (err) {
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/family-recipes
 * Returns the user's family recipes - we don't intend on keeping too much so fetching all of them is fine
 */
router.get("/family-recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const familyRecipes = await family_utils.getFamilyRecipes(user_id);
    res.json({ familyRecipes });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/viewed-recipes
 * Return the last‐three recipes this user has viewed.
 */
router.get("/viewed-recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const viewedRecipes = await get_last_three_views(user_id);
    res.json({ viewedRecipes });
  }
  catch (err) {
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/last-search
 * Returns the last search parameters for the logged-in user
 */
router.get("/last-search", async (req, res, next) => {
  try {
    const uid = req.session.user_id;
    if (!uid) return res.sendStatus(401);
    const last = await require("./utils/user_utils").getLastSearch(uid);
    res.json({ lastSearch: last || {} });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

module.exports = router;
