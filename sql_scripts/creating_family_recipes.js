const mysql = require("mysql2/promise");
require("dotenv").config();

(async function initializeFamilyRecipesTable() {
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

    console.log("Creating 'family_recipes' table...");

    const createFamilyRecipesTableQuery = `
      CREATE TABLE IF NOT EXISTS family_recipes (
        recipe_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        owner VARCHAR(100) NOT NULL,
        occasion VARCHAR(255),
        image VARCHAR(255),
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    await connection.query(createFamilyRecipesTableQuery);

    console.log("'family_recipes' table was created successfully.");

    await connection.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error("Failed to create 'family_recipes' table:", err.message);
  }
})();
