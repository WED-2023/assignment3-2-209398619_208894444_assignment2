const mysql = require("mysql2/promise");
require("dotenv").config();

(async function setupFavoritesTable() {
  try {
    const config = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to the database...");

    const connection = await mysql.createConnection(config);

    console.log("Creating 'favorites' table...");

    const createFavoritesQuery = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY user_recipe (user_id, recipe_id)
      );
    `;

    await connection.query(createFavoritesQuery);

    console.log("'favorites' table created successfully.");

    await connection.end();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Failed to create 'favorites' table:", err.message);
  }
})();
