class Recipe {
    constructor({
      recipe_id,
      user_id,
      title,
      image,
      ready_in_minutes,
      popularity,
      vegan,
      vegetarian,
      gluten_free,
      servings,
      instructions,
      created_at,
      ingredients = [],
    }) {
      this.recipe_id = recipe_id;
      this.user_id = user_id;
      this.title = title;
      this.image = image;
      this.ready_in_minutes = ready_in_minutes;
      this.popularity = popularity;
      this.vegan = vegan;
      this.vegetarian = vegetarian;
      this.gluten_free = gluten_free;
      this.servings = servings;
      this.instructions = instructions;
      this.created_at = created_at;
      this.ingredients = ingredients;
    }
  
    /**
     * Return a simplified view of the recipe, for preview listing
     */
    toPreview() {
      return {
        id: this.recipe_id,
        title: this.title,
        image: this.image,
        readyInMinutes: this.ready_in_minutes,
        popularity: this.popularity,
        vegan: this.vegan,
        vegetarian: this.vegetarian,
        glutenFree: this.gluten_free,
      };
    }
  
    /**
     * Return the complete recipe details
     */
    toFullObject() {
      return {
        id: this.recipe_id,
        title: this.title,
        image: this.image,
        readyInMinutes: this.ready_in_minutes,
        popularity: this.popularity,
        vegan: this.vegan,
        vegetarian: this.vegetarian,
        glutenFree: this.gluten_free,
        servings: this.servings,
        instructions: this.instructions,
        ingredients: this.ingredients,
      };
    }
  
    /**
     * Build a Recipe object from a row returned by the DB
     */
    static buildFromDb(row) {
      return new Recipe({
        recipe_id: row.recipe_id,
        user_id: row.user_id,
        title: row.title,
        image: row.image,
        ready_in_minutes: row.ready_in_minutes,
        popularity: row.popularity,
        vegan: row.vegan,
        vegetarian: row.vegetarian,
        gluten_free: row.gluten_free,
        servings: row.servings,
        instructions: row.instructions,
        created_at: row.created_at,
        ingredients: row.ingredients ? JSON.parse(row.ingredients) : [],
      });
    }
  
    /**
     * Build a Recipe object from the Spoonacular API response
     */
    static buildFromApi(apiResponse, user_id = null) {
      return new Recipe({
        recipe_id: apiResponse.id,
        user_id,
        title: apiResponse.title,
        image: apiResponse.image,
        ready_in_minutes: apiResponse.readyInMinutes,
        popularity: apiResponse.aggregateLikes || 0,
        vegan: apiResponse.vegan || false,
        vegetarian: apiResponse.vegetarian || false,
        gluten_free: apiResponse.glutenFree || false,
        servings: apiResponse.servings || 1,
        instructions: apiResponse.instructions || "Instructions not available",
        ingredients: apiResponse.extendedIngredients
          ? apiResponse.extendedIngredients.map((i) => i.original)
          : [],
      });
    }
  }
  
  module.exports = Recipe;
  