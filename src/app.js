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

//Logout which destroys the cookie
app.get("/logout", (req, res) => {
  // Destroy the cookie
  if (req.cookies.emailToken == null) res.redirect("login");
  res.clearCookie("emailToken");
  res.redirect("/");
});

//Dashboard Page
app.get("/dashboard", async (req, res) => {
  if (req.cookies.emailToken == null) res.redirect("login");
  try {
    const decoded = await jwt.verify(req.cookies.emailToken, "coinCanvas");
    const categoryData = await Expenses.aggregate([
      { $match: { user: decoded.username } },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
    const userEmailToken = {
      username: decoded.username,
      categoryData: categoryData,
    };

    res.render("dashboard", userEmailToken);
  } catch (err) {
    res.render("index");
  }
});

//Analysis Page
app.get("/analysis", async (req, res) => {
  if (req.cookies.emailToken == null) res.redirect("login");
  try {
    const decoded = await jwt.verify(req.cookies.emailToken, "coinCanvas");

    // Get current date
    const currentDate = new Date();

    // Define start and end dates for different intervals
    const startDateDaily = new Date(currentDate);
    startDateDaily.setHours(0, 0, 0, 0);

    const startDateWeekly = new Date(currentDate);
    startDateWeekly.setDate(currentDate.getDate() - currentDate.getDay());
    startDateWeekly.setHours(0, 0, 0, 0);

    const startDateMonthly = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const startDateYearly = new Date(
      currentDate.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0
    );

    // Function to group expenses based on date
    const groupByDate = (intervalStartDate) => {
      const byDate = Expenses.aggregate([
        {
          $match: {
            user: decoded.username,
            paymentDate: { $gte: intervalStartDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" },
            },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);
      return byDate;
    };

    // Function to group expenses based on month name
    const groupByMonth = (intervalStartDate) => {
      const byMonth = Expenses.aggregate([
        {
          $match: {
            user: decoded.username,
            paymentDate: { $gte: intervalStartDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%B", date: "$paymentDate" } },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);
      return byMonth;
    };

    // Fetch data for different intervals
    const dailyExpenses = await groupByDate(startDateDaily);
    const weeklyExpenses = await groupByWeek(startDateWeekly);
    const monthlyExpenses = await groupByMonth(startDateMonthly);
    const yearlyExpenses = await groupByDate(startDateYearly);

    const userEmailToken = {
      username: decoded.username,
      dailyExpenses: dailyExpenses,
      weeklyExpenses: weeklyExpenses,
      monthlyExpenses: monthlyExpenses,
      yearlyExpenses: yearlyExpenses,
    };

    res.render("analysis", userEmailToken);
  } catch (err) {
    console.log(err);
    res.render("index");
  }
});

//To redirect addExpense page
app.get("/addExpense", async (req, res) => {
  if (req.cookies.emailToken == null) res.redirect("login");
  try {
    //Checking the token which is login user
    const decoded = await jwt.verify(req.cookies.emailToken, "coinCanvas");
    console.log(decoded.username);
    const expenseDetails = await Expenses.find({ user: decoded.username });

    // Calculate total expenses
    const totalExpenses = expenseDetails.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    console.log("Total Expenses:", totalExpenses);

    // Find expenses with payment status "Pending"
    const pendingExpenses = await Expenses.find({
      user: decoded.username,
      paymentStatus: "Pending",
    });
    // Calculate total pending expenses
    const totalPendingExpenses = pendingExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    console.log("Total Pending Expenses:", totalPendingExpenses);

    // Find expenses with payment status "Pending"
    const doneExpenses = await Expenses.find({
      user: decoded.username,
      paymentStatus: "Done",
    });
    // Calculate total pending expenses
    const totalDoneExpenses = doneExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    console.log("Total Pending Expenses:", totalDoneExpenses);

    const userEmailToken = {
      username: decoded.username,
      expenses: expenseDetails,
      totalExpenses: totalExpenses,
      totalPendingExpenses: totalPendingExpenses,
      totalDoneExpenses: totalDoneExpenses,
    };
    res.render("addExpense", userEmailToken);
  } catch (err) {
    res.render("index");
    res.redirect("/");
  }
});
