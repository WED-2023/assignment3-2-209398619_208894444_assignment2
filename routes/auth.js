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
     let user_details = {
    username:  req.body.username,
    firstname: req.body.firstname,
    lastname:  req.body.lastname,
    country:   req.body.country,
    password:  req.body.password,
    email:     req.body.email,
    profilePic:req.body.profilePic
  };

  // 1) check for existing username
  let users = await DButils.execQuery("SELECT username from users");
  if (users.find(x => x.username === user_details.username))
    throw { status: 409, message: "Username taken" };

    // 2) hash password
     let hash = bcrypt.hashSync(user_details.password,parseInt(process.env.bcrypt_saltRounds));

    // 3) insert into DB
    await DButils.execQuery(
    `INSERT INTO users (username, firstname, lastname, country, hash, email, profilePic)
     VALUES ('${user_details.username}',
             '${user_details.firstname}',
             '${user_details.lastname}',
             '${user_details.country}',
             '${hash}',
             '${user_details.email}',
             '${user_details.profilePic}')`
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
   const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    const user = (await DButils.execQuery(`SELECT * FROM users WHERE username = '${req.body.username}'`))[0];

    // 2) compare password
    if (!bcrypt.compareSync(req.body.password, user.hash)) {
      throw { status: 401, message: "Username or Password is incorrect" };}

    // 3) set session and cookie
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

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
 * Clears the session cookie and deletes their last_search.
 */
router.post("/logout", async (req, res, next) => {
  try {
    const uid = req.session.user_id;
    console.log("session user_id Logout:", uid);

    // 1) delete their last_search
    await require("./utils/user_utils")
      .execQuery(`DELETE FROM last_search WHERE user_id = ${uid}`);

    // 2) clear the session
    req.session.reset();

    res.json({ success: true, message: "Logout successful" });
  }
  catch (err) {
    next(err);
  }
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
