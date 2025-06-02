require("dotenv").config();
const MySql = require("./MySql");

exports.execQuery = async function (query, params=[]) {
  const connection = await MySql.connection();
  try {
    await connection.query("START TRANSACTION");
    const result = await connection.query(query, params);
    await connection.query("COMMIT");
    return result;
  } catch (err) {
    await connection.query("ROLLBACK");
    throw err;
  } finally {
    await connection.release();
  }
};


