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
      '${sqlEscapeString(recipe.title)}',
      ${recipe.image ? `'${sqlEscapeString(recipe.image)}'` : "NULL"},
      ${recipe.readyInMinutes},
      0,
      ${recipe.vegan ? 1 : 0},
      ${recipe.vegetarian ? 1 : 0},
      ${recipe.glutenFree ? 1 : 0},
      ${recipe.servings},
      '${sqlEscapeString(recipe.instructions)}'
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
        '${sqlEscapeString(ing.name)}',
        ${ing.amount},
        '${sqlEscapeString(ing.unit)}'
      );
    `;
    await DButils.execQuery(insertIngSql);
  }

  return newRecipeId;
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

module.exports = {
  getRandomRecipes,
  searchRecipes,
  getRecipeDetails,
  createPersonalRecipe,
  get_last_three_views,
  getRecipePreview
};
