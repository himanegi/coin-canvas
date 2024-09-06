const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const supportSchema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  subject: String,
  description: String,
});

const support = new mongoose.model("support", supportSchema);
module.exports = support;
