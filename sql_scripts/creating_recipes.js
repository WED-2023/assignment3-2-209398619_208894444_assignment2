const mysql = require("mysql2/promise");
require("dotenv").config();

(async function setupRecipeTables() {
  try {
    const config = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to database using provided environment variables...");

    const connection = await mysql.createConnection(config);

    console.log("Creating table for personal recipes...");

    const createRecipesTable = `
      CREATE TABLE IF NOT EXISTS recipes (
        recipe_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        ready_in_minutes INT,
        popularity INT DEFAULT 0,
        vegan BOOLEAN DEFAULT FALSE,
        vegetarian BOOLEAN DEFAULT FALSE,
        gluten_free BOOLEAN DEFAULT FALSE,
        servings INT DEFAULT 1,
        instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    await connection.query(createRecipesTable);

    console.log("Creating table for recipe ingredients...");

    const createIngredientsTable = `
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipe_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        amount FLOAT,
        unit VARCHAR(50),
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
      );
    `;

    await connection.query(createIngredientsTable);

    console.log("Recipe-related tables created successfully.");

    await connection.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error("Failed to create recipe tables:", err.message);
  }
})();
