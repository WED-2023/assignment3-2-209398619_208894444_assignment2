const axios = require("axios");
const api = "https://api.spoonacular.com/recipes";
const KEY = process.env.SPOONACULAR_API_KEY;
const DButils = require("./DButils");


/*-------------------------------------------------------------------------------------------*/

/**
 * Map a Spoonacular recipe object to our RecipePreview schema.
 */
function mapToPreview(r) {
  return {
    id:             r.id,
    title:          r.title,
    readyInMinutes: r.readyInMinutes,
    image:          r.image,
    popularity:     r.aggregateLikes,
    vegan:          r.vegan,
    vegetarian:     r.vegetarian,
    glutenFree:     r.glutenFree,
    viewed:         false,
    favorite:       false,
  };
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Fetch a single recipe’s preview and tag viewed/favorite flags - this is for the favorites page to set the favorite field as true
 * @param {number} recipeId 
 * @param {boolean} viewed 
 * @param {boolean} favorite 
 * @returns {Promise<RecipePreview>}
 */
async function getRecipePreview(recipeId, viewed = false, favorite = false) {
  // grab full info so we can map down to preview
  const full = await getRecipeDetails(recipeId);
  return {
    id:             full.id,
    title:          full.title,
    readyInMinutes: full.readyInMinutes,
    image:          full.image,
    popularity:     full.popularity,
    vegan:          full.vegan,
    vegetarian:     full.vegetarian,
    glutenFree:     full.glutenFree,
    viewed,   // from param
    favorite, // from param
  };
}

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /recipes/random
 */
async function getRandomRecipes(number = 3) {
  const { data } = await axios.get(`${api}/random`, {
    params: { number, apiKey: KEY }
  });
  return data.recipes.map(mapToPreview);
}

/*-------------------------------------------------------------------------------------------*/

/**
 * GET /recipes/search
 */
async function searchRecipes({ query, cuisine, diet, intolerances, number = 5, sort = "popularity" }) {
  const { data } = await axios.get(`${api}/complexSearch`, {
    params: {
      query,
      cuisine,
      diet,
      intolerances,
      number,
      sort,
      addRecipeInformation: true,
      apiKey: KEY,
    }
  });
  return data.results.map(r => ({
    id:             r.id,
    title:          r.title,
    readyInMinutes: r.readyInMinutes,
    image:          r.image,
    popularity:     r.aggregateLikes,
    vegan:          r.vegan,
    vegetarian:     r.vegetarian,
    glutenFree:     r.glutenFree,
    viewed:         false,
    favorite:       false,
    instructions:   r.instructions || ""
  }));
}


/*-------------------------------------------------------------------------------------------*/

/**
 * GET /recipes/:id  (full details)
 */
async function getRecipeDetails(id) {
  const { data } = await axios.get(`${api}/${id}/information`, {
    params: { includeNutrition: false, apiKey: KEY }
  });
  const ingredients = data.extendedIngredients.map(ing => ({
    id:     ing.id,
    name:   ing.name,
    amount: ing.amount,
    unit:   ing.unit
  }));
  return {
    id:             data.id,
    title:          data.title,
    image:          data.image,
    readyInMinutes: data.readyInMinutes,
    popularity:     data.aggregateLikes,
    vegan:          data.vegan,
    vegetarian:     data.vegetarian,
    glutenFree:     data.glutenFree,
    servings:       data.servings,
    ingredients,                      // array of {id,name,amount,unit}
    instructions:   data.instructions || "",
    viewed:         false,
    favorite:       false,
  };
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Inserts a new personal recipe and its ingredients.
 * @param {Object} recipe       The recipe payload from the client
 * @param {number} user_id      The logged-in user’s ID
 * @returns {number}            The new recipe_id
 */
async function createPersonalRecipe(recipe, user_id) {
  // build the INSERT for the recipes table
  const insertRecipeSql = `
    INSERT INTO recipes
      (user_id, title, image, ready_in_minutes, popularity,
       vegan, vegetarian, gluten_free, servings, instructions)
    VALUES (
      ${user_id},
      '${escape(recipe.title)}',
      ${recipe.image ? `'${escape(recipe.image)}'` : "NULL"},
      ${recipe.readyInMinutes},
      0,
      ${recipe.vegan ? 1 : 0},
      ${recipe.vegetarian ? 1 : 0},
      ${recipe.glutenFree ? 1 : 0},
      ${recipe.servings},
      '${escape(recipe.instructions)}'
    );
  `;
  const result = await DButils.execQuery(insertRecipeSql);
  const newRecipeId = result.insertId;

  // now insert each ingredient
  for (const ing of recipe.ingredients) {
    const insertIngSql = `
      INSERT INTO recipe_ingredients
        (recipe_id, name, amount, unit)
      VALUES (
        ${newRecipeId},
        '${escape(ing.name)}',
        ${ing.amount},
        '${escape(ing.unit)}'
      );
    `;
    await DButils.execQuery(insertIngSql);
  }

  return newRecipeId;
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Scale a user’s personal recipe to a new servings count.
 * Updates both the recipes.servings field and each recipe_ingredients.amount.
 *
 * @param {number} recipeId
 * @param {number} newServings
 * @param {number} userId
 * @returns {Array} updated ingredients [{ id, name, amount, unit }, …]
 */
async function updateServings(recipeId, newServings, userId) {
  // 1) Fetch current servings
  const rows = await DButils.execQuery(
    `SELECT servings
       FROM recipes
      WHERE recipe_id = ? AND user_id = ?`,
    [recipeId, userId]
  );
  if (rows.length === 0) {
    const err = new Error("Recipe not found or not yours");
    err.status = 404;
    throw err;
  }
  const oldServings = rows[0].servings;

  // 2) Fetch all ingredients for that recipe
  const ingredients = await DButils.execQuery(
    `SELECT id, name, amount, unit
       FROM recipe_ingredients
      WHERE recipe_id = ?`,
    [recipeId]
  );

  // 3) Compute the scale factor and new amounts
  const factor = newServings / oldServings;
  const updated = ingredients.map(ing => ({
    id:     ing.id,
    name:   ing.name,
    amount: Math.round(ing.amount * factor * 100) / 100,
    unit:   ing.unit,
  }));

  // 4) Persist the new servings count
  await DButils.execQuery(
    `UPDATE recipes
        SET servings = ?
      WHERE recipe_id = ? AND user_id = ?`,
    [newServings, recipeId, userId]
  );

  // 5) Persist each ingredient’s new amount
  await Promise.all(updated.map(ing =>
    DButils.execQuery(
      `UPDATE recipe_ingredients
          SET amount = ?
        WHERE id = ?`,
      [ing.amount, ing.id]
    )
  ));

  return updated;
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Fetch the last three recipes a user has viewed.
 * Returns an array of preview-shaped objects.
 */
async function get_last_three_views(user_id) {
  // pull the 3 most recent view records
  const rows = await DButils.execQuery(`
    SELECT recipe_id
      FROM views
     WHERE user_id = '${user_id}'
     ORDER BY viewed_at DESC
     LIMIT 3
  `);

  // for each id, call the API for full info, then map to our preview shape
  const previews = await Promise.all(
    rows.map(r =>
      getRecipeDetails(r.recipe_id).then(full => ({
        id:             full.id,
        title:          full.title,
        readyInMinutes: full.readyInMinutes,
        image:          full.image,
        popularity:     full.popularity,
        vegan:          full.vegan,
        vegetarian:     full.vegetarian,
        glutenFree:     full.glutenFree,
        viewed:         true,
        favorite:       false,
      }))
    )
  );
  return previews;
}

/*-------------------------------------------------------------------------------------------*/

/*-------------------------------------------------------------------------------------------*/

/*-------------------------------------------------------------------------------------------*/

/*-------------------------------------------------------------------------------------------*/

module.exports = {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  createPersonalRecipe,
  updateServings,
  get_last_three_views,
  getRecipePreview
};
