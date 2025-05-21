// routes/utils/user_utils.js

const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");  // to build previews

/*-------------------------------------------------------------------------------------------*/


/**
 * Adds a recipe to the user’s favorites.
 * Uses INSERT IGNORE so duplicates don’t error.
 */
async function addFavoriteRecipe(user_id, recipe_id) {
  await DButils.execQuery(
    `INSERT IGNORE INTO favorites (user_id, recipe_id)
     VALUES (?, ?)`,
    [user_id, recipe_id]
  );
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Returns an array of recipe IDs this user has favorited.
 * @returns {Promise<number[]>}
 */
async function getFavoriteRecipeIds(user_id) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id
       FROM favorites
      WHERE user_id = ?`,
    [user_id]
  );
  return rows.map(r => r.recipe_id);
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Returns full RecipePreview objects for a user’s favorites.
 * (calls getFavoriteRecipeIds + recipes_utils.getRecipePreview)
 */
async function getFavoriteRecipes(user_id) {
  const ids = await getFavoriteRecipeIds(user_id);
  return Promise.all(
    ids.map(id => recipes_utils.getRecipePreview(id, false, true))
  );
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Fetches all personal recipes created by this user.
 * Returns an array of RecipePreview objects.
 * @returns {Promise<RecipePreview[]>}
 */
async function getUserRecipes(user_id) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id
           , title
           , image
           , ready_in_minutes    AS readyInMinutes
           , popularity
           , vegan
           , vegetarian
           , gluten_free         AS glutenFree
           , servings
        FROM recipes
       WHERE user_id = ?`,
    [user_id]
  );
  // map to preview shape
  return rows.map(r => ({
    id:             r.recipe_id,
    title:          r.title,
    image:          r.image,
    readyInMinutes: r.readyInMinutes,
    popularity:     r.popularity,
    vegan:          !!r.vegan,
    vegetarian:     !!r.vegetarian,
    glutenFree:     !!r.glutenFree,
    viewed:         false,
    favorite:       false,
    servings:       r.servings   // you may not need this in previews
  }));
}

/*-------------------------------------------------------------------------------------------*/

module.exports = {
  addFavoriteRecipe,
  getFavoriteRecipeIds,
  getFavoriteRecipes,
  getUserRecipes
};
