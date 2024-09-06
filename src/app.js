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

//Starts the Email verification using Etherial smtp server
app.post("/sendOtp", (req, res) => {
  if (req.body.pass === req.body.cpass) {
    sendMailer.sendMail(req.body.email, otp);
  } else {
    //Desktop notification
    notifier.notify({
      title: "@coincanvas",
      message: "Password Not Matched!",
      icon: path.join(__dirname, "icon.jpg"),
      sound: true,
      wait: true,
    });
    req.body.pass = null;
    req.body.cpass = null;
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

//create a new user in our database
app.post("/register", async (req, res) => {
  try {
    if (req.body.otp == otp) {
      const registerEmployee = new Registers({
        name: req.body.name,
        email: req.body.email,
        contact: req.body.contact,
        password: req.body.pass,
      });
      //Inserting data into DB
      const registered = await registerEmployee.save();
      res.status(201).render("login");
      console.log("Insertion Done!");
    } else {
      //Desktop notification
      notifier.notify({
        title: "@coinCanvas",
        message: "Invalid OTP!",
        icon: path.join(__dirname, "icon.jpg"),
        sound: true,
        wait: true,
      });
      req.body.otp = null;
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//Render login page
app.get("/login", (req, res) => {
  if (req.cookies.emailToken == null) res.render("login");
  else res.render("dashboard");
});

//Login as well as Generating tokenCookie
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const pass = req.body.pass;
    const userEmail = await Registers.findOne({ email: email });
    //To check Email validation
    if (userEmail == null) {
      console.log("User Not Found!");
      return res.status(400).send("User Not Found!");
    }
    const passwordMatch = await bcrypt.compare(pass, userEmail.password);

    if (passwordMatch) {
      const userData = { username: userEmail.email };
      //Token setup
      const token = jwt.sign(userData, "coinCanvas", { expiresIn: "1h" });
      const cookieOptions = {
        expiresIn: "1h",
        httpOnly: true,
      };
      //Cookie setup
      res.cookie("emailToken", token, cookieOptions);
      res.redirect("dashboard");
    } else {
      //Desktop notification
      notifier.notify({
        title: "@coinCanvas",
        message: "Invalid Details!",
        icon: path.join(__dirname, "icon.jpg"),
        sound: true,
        wait: true,
      });
      req.body.otp = null;
    }
  } catch (err) {
    res.send(err);
  }
});
