const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentDate: String,
  Description: String,
  user: String,
  paymentStatus: {
    type: String,
  },
});

const addExpense = new mongoose.model("expense", expenseSchema);

module.exports = addExpense;
