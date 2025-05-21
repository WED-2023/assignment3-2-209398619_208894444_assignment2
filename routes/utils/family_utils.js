// routes/utils/family_utils.js
const DButils = require("./DButils");

/*-------------------------------------------------------------------------------------------*/

/**
 * Fetch all family recipes for a given user.
 */
async function getFamilyRecipes(user_id) {
  const rows = await DButils.execQuery(
    `SELECT * 
       FROM family_recipes 
      WHERE user_id='${user_id}'`
  );
  return rows.map(r => ({
    id:           r.recipe_id,
    title:        r.title,
    owner:        r.owner,
    occasion:     r.occasion,
    image:        r.image,                // single URL
    ingredients:  JSON.parse(r.ingredients),
    instructions: r.instructions,
    images:       r.image ? [r.image] : [], // back-compat, API wants array
    createdAt:    r.created_at,
  }));
}

/*-------------------------------------------------------------------------------------------*/

/**
 * Insert a new family recipe and return its new ID.
 * Expects `recipe` to have: title, owner, occasion, image, ingredients (array), instructions.
 */
async function addFamilyRecipe(user_id, recipe) {
  const ingredientsJson = JSON.stringify(recipe.ingredients);
  await DButils.execQuery(
    `INSERT INTO family_recipes
       (user_id, title, owner, occasion, image, ingredients, instructions)
     VALUES
       ('${user_id}',
        '${recipe.title}',
        '${recipe.owner}',
        '${recipe.occasion}',
        '${recipe.image}',
        '${ingredientsJson}',
        '${recipe.instructions}'
       )`
  );
  // grab the auto-incremented id
  const result = await DButils.execQuery(`SELECT LAST_INSERT_ID() AS recipe_id`);
  return result[0].recipe_id;
}

/*-------------------------------------------------------------------------------------------*/

module.exports = {
  getFamilyRecipes,
  addFamilyRecipe,
};
