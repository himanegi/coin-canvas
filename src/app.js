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
const port = process.env.PORT || 8000;
require("./db/conn");

const Registers = require("./model/register");
const Expenses = require("./model/addExpense");
const Supports = require("./model/support");

const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
