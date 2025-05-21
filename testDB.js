// testDB.js
const DButils = require("./routes/utils/DButils");

(async () => {
  try {
    const users = await DButils.execQuery("SELECT * FROM users");
    console.log("users table rows:", users);
  }
  catch (err) {
    console.error("DB error:", err);
  }
  finally {
    // force the process to exit now that we’re done
    process.exit(0);
  }
})();
