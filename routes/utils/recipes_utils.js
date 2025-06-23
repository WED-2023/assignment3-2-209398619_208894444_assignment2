const axios = require("axios");
const api = "https://api.spoonacular.com/recipes";
const KEY = process.env.SPOONACULAR_API_KEY;
const DButils = require("./DButils");


/*-------------------------------------------------------------------------------------------*/

/**
 * A small helper that escapes single-quotes in a string by doubling them.
 * (e.g.  Hello 'world'  =>  Hello ''world''  )
 */
function sqlEscapeString(str) {
  // If it's not a string, just return it unchanged:
  if (typeof str !== "string") return str;
  // Replace every single quote with two single quotes:
  return str.replace(/'/g, "''");
}

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
 * Fetch a single recipe's preview and tag viewed/favorite flags - this is for the favorites page to set the favorite field as true
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
 * @param {number} user_id      The logged-in user's ID
 * @returns {number}            The new recipe_id
 */
async function createPersonalRecipe(recipe, user_id) {
  // The frontend sends ingredients and instructions as simple arrays of strings.
  // We will store them as JSON strings in the database.
  const ingredientsJSON = JSON.stringify(recipe.ingredients || []);
  const instructionsString = recipe.instructions.join(';'); // Store as a single semicolon-delimited string

  const insertRecipeSql = `
    INSERT INTO recipes
      (user_id, title, image, ready_in_minutes, popularity,
       vegan, vegetarian, gluten_free, servings, instructions, ingredients)
    VALUES (
      ${user_id},
      '${sqlEscapeString(recipe.title)}',
      ${recipe.image ? `'${sqlEscapeString(recipe.image)}'` : "NULL"},
      ${recipe.readyInMinutes || 0},
      0,
      ${recipe.vegan ? 1 : 0},
      ${recipe.vegetarian ? 1 : 0},
      ${recipe.glutenFree ? 1 : 0},
      ${recipe.servings || 0},
      '${sqlEscapeString(instructionsString)}',
      '${sqlEscapeString(ingredientsJSON)}'
    );
  `;
  const result = await DButils.execQuery(insertRecipeSql);
  return result.insertId;
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

/**
 * Fetch a recipe's details from the database and parse ingredients and instructions from string to array
 * @param {number} recipe_id 
 * @returns {Promise<Recipe>}
 */
async function getPersonalRecipeDetails(recipe_id) {
  const recipeQuery = await DButils.execQuery(`SELECT * FROM recipes WHERE recipe_id = '${recipe_id}'`);
  if (recipeQuery.length === 0) {
    return null; // Return null if not found
  }

  const result = recipeQuery[0];

  // Make parsing robust to handle non-JSON string data
  try {
    result.ingredients = JSON.parse(result.ingredients);
  } catch (e) {
    // If it's not valid JSON, treat it as a plain string and wrap it for consistency.
    result.ingredients = (typeof result.ingredients === 'string') 
      ? result.ingredients.split(';').map(i => i.trim()).filter(i => i)
      : [];
  }

  try {
    result.instructions = JSON.parse(result.instructions);
  } catch (e) {
    result.instructions = (typeof result.instructions === 'string')
      ? result.instructions.split(';').map(i => i.trim()).filter(i => i)
      : [];
  }

  return result;
}

/*-------------------------------------------------------------------------------------------*/

module.exports = {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  createPersonalRecipe,
  get_last_three_views,
  getRecipePreview,
  getPersonalRecipeDetails
};
