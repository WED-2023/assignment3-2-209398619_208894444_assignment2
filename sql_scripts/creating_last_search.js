const mysql = require("mysql2/promise");
require("dotenv").config();

(async function setupLastSearchTable() {
  try {
    const dbConfig = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to database...");

    const connection = await mysql.createConnection(dbConfig);

    console.log("Creating 'last_search' table...");

    const createLastSearchQuery = `
      CREATE TABLE IF NOT EXISTS last_search (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        search_query VARCHAR(255) NOT NULL,
        number INT DEFAULT 5,
        cuisine VARCHAR(100),
        diet VARCHAR(100),
        intolerances VARCHAR(255),
        search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY user_search (user_id)
      );
    `;

    await connection.query(createLastSearchQuery);

    console.log("'last_search' table created successfully.");

    await connection.end();
    console.log("Connection closed.");
  } catch (err) {
    console.error("Failed to create 'last_search' table:", err.message);
  }
})();
