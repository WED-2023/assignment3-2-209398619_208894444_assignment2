const mysql = require("mysql2/promise");
require("dotenv").config();

(async function setupMealPlanningTable() {
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

    console.log("Creating 'meal_planning' table...");

    const createMealPlanningQuery = `
      CREATE TABLE IF NOT EXISTS meal_planning (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        is_user_recipe BOOLEAN DEFAULT FALSE,
        sequence_order INT NOT NULL, -- מייצג את הסדר בארוחה
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `;

    await connection.query(createMealPlanningQuery);

    console.log("'meal_planning' table created successfully.");

    await connection.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error("Failed to create 'meal_planning' table:", err.message);
  }
})();
