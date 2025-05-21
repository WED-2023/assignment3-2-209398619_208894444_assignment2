const mysql = require("mysql2/promise");
require("dotenv").config();

(async function createUsersTable() {
  try {
    const dbParams = {
      host: process.env.host,
      user: process.env.user,
      password: process.env.DBpassword,
      database: process.env.database,
      port: process.env.DBport,
    };

    console.log("Connecting to MySQL...");

    const connection = await mysql.createConnection(dbParams);

    const dbName = dbParams.database;

    // מוודאים שהמסד קיים
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log("Creating 'users' table...");

    const usersTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(8) NOT NULL UNIQUE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        country VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await connection.query(usersTableSQL);

    console.log("'users' table has been successfully created.");

    await connection.end();
    console.log("MySQL connection closed.");
  } catch (err) {
    console.error("Failed to create the users table:", err.message);
  }
})();
