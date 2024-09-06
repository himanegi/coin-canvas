require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const notifier = require("node-notifier");
const requests = require("requests");
const sendMailer = require("./smtp/server");
const port = process.env.PORT || 8000;
require("./db/conn");

const Registers = require("./model/register");
const Expenses = require("./model/addExpense");
const Supports = require("./model/support");

const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

app.use(express.static(staticPath));
app.set("view engine", "hbs");
app.set("views", templatePath);
hbs.registerPartials(partialsPath);
hbs.registerHelper("json", function (context) {
  return JSON.stringify(context);
});
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  if (req.cookies.emailToken == null) res.render("index");
  else res.render("dashboard");
});
app.get("/index", (req, res) => {
  res.render("index");
});

//Generate OTP
function generateOTP() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}
const otp = generateOTP();
