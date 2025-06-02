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

module.exports = {getFamilyRecipes,};
