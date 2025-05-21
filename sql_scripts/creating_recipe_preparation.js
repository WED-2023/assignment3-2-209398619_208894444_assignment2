const mysql = require("mysql2/promise");
require("dotenv").config();

(async function setupRecipePreparationTable() {
  try {
    const config = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to database...");

    const connection = await mysql.createConnection(config);

    console.log("Creating 'recipe_preparation' table...");

    const createPreparationQuery = `
      CREATE TABLE IF NOT EXISTS recipe_preparation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        is_user_recipe BOOLEAN DEFAULT FALSE,
        step_number INT NOT NULL,
        step_description TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY user_recipe_step (user_id, recipe_id, is_user_recipe, step_number)
      );
    `;

    await connection.query(createPreparationQuery);

    console.log("'recipe_preparation' table created successfully.");

    await connection.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error("Failed to create 'recipe_preparation' table:", err.message);
  }
})();
