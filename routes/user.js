// routes/user.js
const express       = require("express");
const router        = express.Router();
const user_utils    = require("./utils/user_utils");
const recipes_utils = require("./utils/recipes_utils");
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
    if (!recipe_id) return res.status(400).json({ error: "Missing recipeId" });

    // Delegate to user_utils (uses INSERT IGNORE)
    await user_utils.addFavoriteRecipe(user_id, recipe_id);
    res.status(201).json({ message: "Recipe added to favorites" });
  }
  catch (err) {
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
    // Delegate to user_utils (returns full preview objects)
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    res.json({ favorites });
  }
  catch (err) {
    next(err);
  }
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
 * GET /users/viewed-recipes
 * Return the last‐three recipes this user has viewed.
 */
router.get("/viewed-recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    // We assume user_utils.getLastViews returns RecipePreview[]
    const viewedRecipes = await user_utils.getLastViews(user_id);
    res.json({ viewedRecipes });
  }
  catch (err) {
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /users/family-recipes
 * Returns: { familyRecipes: [ FamilyRecipe, … ] }
 */
router.get("/family-recipes", async (req, res, next) => {
  try {
    const user_id       = req.user_id;
    const familyRecipes = await family_utils.getFamilyRecipes(user_id);
    res.json({ familyRecipes });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * POST /users/family-recipes
 * Body JSON (all required except image):
 *   { title, owner, occasion, image, ingredients, instructions }
 */
router.post("/family-recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const recipe  = req.body;

    // basic validation
    for (const field of ["title","owner","occasion","ingredients","instructions"]) {
      if (!recipe[field]) {
        return res.status(400).json({ error:`Missing field "${field}"` });
      }
    }
    if (!Array.isArray(recipe.ingredients)) {
      return res.status(400).json({ error:"`ingredients` must be an array" });
    }

    const newId = await family_utils.addFamilyRecipe(user_id, recipe);
    res.status(201).json({ recipe_id:newId, message:"Family recipe added successfully" });
  }
  catch (err) { next(err); }
});

/*-------------------------------------------------------------------------------------------*/

module.exports = router;
