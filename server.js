const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "webproject123",
});
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(
  session({
    secret: "mysecret",
    cookie: { maxAge: 1000 * 60 * 5 },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.session());