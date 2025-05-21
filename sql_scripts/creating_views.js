const mysql = require("mysql2/promise");
require("dotenv").config();

(async function createViewsTable() {
  try {
    const dbSettings = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to the database...");

    const connection = await mysql.createConnection(dbSettings);

    console.log("Creating table for tracking user views...");

    const createViewsSQL = `
      CREATE TABLE IF NOT EXISTS views (
        view_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX (user_id, viewed_at)
      );
    `;

    await connection.query(createViewsSQL);

    console.log("'views' table has been successfully created.");

    await connection.end();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("An error occurred while creating the 'views' table:", err.message);
  }
})();
