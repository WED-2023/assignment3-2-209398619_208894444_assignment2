// routes/utils/user_utils.js

const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");  // to build previews

/*-------------------------------------------------------------------------------------------*/

/**
 * Add a recipe to this user’s favorites.
 * Throws {status:409, message:…} if already favorited.
 */
async function addFavoriteRecipe(user_id, recipe_id) {
  try {
    await DButils.execQuery(`
      INSERT INTO favorites (user_id, recipe_id)
      VALUES (${user_id}, ${recipe_id});
    `);
  }
  catch (err) {
    // MySQL duplicate‐entry error code
    if (err.code === "ER_DUP_ENTRY") {
      throw { status: 409, message: "Recipe already in favorites" };
    }
    throw err;
  }
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Returns full RecipePreview objects for a user’s favorites.
 * @param {number} user_id
 * @returns {Promise<RecipePreview[]>}
 */
async function getFavoriteRecipes(user_id) {
  // 1) pull just the recipe_ids
  const rows = await DButils.execQuery(
    `SELECT recipe_id 
       FROM favorites 
      WHERE user_id = ?`,
    [user_id]
  );
  const ids = rows.map(r => r.recipe_id);

  // 2) map each id → preview with favorite=true
  const previews = await Promise.all(
    ids.map(id => recipes_utils.getRecipePreview(id, false, true))
  );
  return previews;
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
    viewed:         false, // adding a new personal recipe doesn't mean you clicked on it (view)
    favorite:       false, // favoriting your own recipe seems odd
    servings:       r.servings 
  }));
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Record that a user viewed a recipe.
 * Inserts a row into the `views` table.
 * @param {number} user_id
 * @param {number} recipe_id
 */
async function recordView(user_id, recipe_id) {
  // 1) check if already viewed
  const exists = await DButils.execQuery(
    `SELECT 1 
       FROM views 
      WHERE user_id = ${user_id} 
        AND recipe_id = ${recipe_id}`
  );

  // 2) if not, insert
  if (exists.length === 0) {
    await DButils.execQuery(
      `INSERT INTO views (user_id, recipe_id)
           VALUES (${user_id}, ${recipe_id});`
    );
  }
}
/*-------------------------------------------------------------------------------------------*/

/*-------------------------------------------------------------------------------------------*/

/**
 * Record or update the last search this user made.
 */
async function upsertLastSearch(user_id, { query, number, cuisine, diet, intolerances }) {
  await DButils.execQuery(`
    INSERT INTO last_search
      (user_id, search_query, number, cuisine, diet, intolerances)
    VALUES
      (${user_id}, '${query}', ${number}, '${cuisine||""}', '${diet||""}', '${intolerances||""}')
    ON DUPLICATE KEY UPDATE
      search_query = '${query}',
      number       = ${number},
      cuisine      = '${cuisine||""}',
      diet         = '${diet||""}',
      intolerances = '${intolerances||""}',
      search_time  = CURRENT_TIMESTAMP
  `);
}


/*-------------------------------------------------------------------------------------------*/

/**
 * Fetch the last search parameters for this user (or null).
 */
async function getLastSearch(user_id) {
  const rows = await DButils.execQuery(`
    SELECT
      search_query   AS query,
      number,
      cuisine,
      diet,
      intolerances
    FROM last_search
    WHERE user_id = ${user_id}
  `);
  return rows[0] || null;
}

/*-------------------------------------------------------------------------------------------*/


module.exports = {
  addFavoriteRecipe,
  getFavoriteRecipes,
  getUserRecipes,
  recordView,
  upsertLastSearch,
  getLastSearch
};
