// routes/auth.js

const express  = require("express");
const axios    = require("axios");
const bcrypt   = require("bcrypt");
const DButils  = require("./utils/DButils");
const router = express.Router();
/*-------------------------------------------------------------------------------------------*/

/**
 * POST /auth/register
 * Register a new user.
 * Body JSON:
 *   { username, firstname, lastname, country,
 *     password, email, profilePic? }
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      username,
      firstname,
      lastname,
      country,
      password,
      email,
      profilePic = null
    } = req.body;

    // 1) check for existing username
    const existing = await DButils.execQuery(
      "SELECT 1 FROM users WHERE username = ?",
      [username]
    );
    if (existing.length) {
      return res.status(409).json({ message: "Username taken", success: false });
    }

    // 2) hash password
    const hash = bcrypt.hashSync(password, parseInt(process.env.bcrypt_saltRounds));

    // 3) insert into DB
    await DButils.execQuery(
      `INSERT INTO users
         (username, firstname, lastname, country, password, email, profilePic)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, firstname, lastname, country, hash, email, profilePic]
    );

    // 4) respond
    res.status(201).json({ message: "User created", success: true });
  }
  catch (err) {
    next(err);
  }
});

/*-------------------------------------------------------------------------------------------*/

/**
 * POST /auth/login
 * Authenticate a user, set a session cookie.
 * Body JSON:
 *   { username, password }
 */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1) fetch the user record
    const users = await DButils.execQuery(
      "SELECT user_id, password FROM users WHERE username = ?",
      [username]
    );
    if (!users.length) {
      return res.status(401).json({ message: "Username or password incorrect", success: false });
    }
    const user = users[0];

    // 2) compare password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Username or password incorrect", success: false });
    }

    // 3) set session
    req.session.user_id = user.user_id;

    // 4) respond
    res.status(200).json({ message: "Login succeeded", success: true });
  }
  catch (err) {
    next(err);
  }
});
/*-------------------------------------------------------------------------------------------*/

/**
 * POST /auth/logout
 * Clears the session cookie.
 */
router.post("/logout", (req, res) => {
  req.session.reset();
  res.json({ message: "Logout succeeded", success: true });
});
/*-------------------------------------------------------------------------------------------*/

/**
 * GET /auth/countries
 * Returns a list of { name, code } for each country.
 * Data is fetched live from restcountries.com.
 */
router.get("/countries", async (req, res, next) => {
  try {
    const { data } = await axios.get("https://restcountries.com/v3.1/all");
    const countries = data
      .map(c => ({ name: c.name.common, code: c.cca2 }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ countries });
  }
  catch (err) {
    next(err);
  }
});
/*-------------------------------------------------------------------------------------------*/

module.exports = router;
