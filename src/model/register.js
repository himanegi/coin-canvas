const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: String,
  password: {
    type: String,
    required: true,
  },
});

//hashed password
employeeSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
});

const Register = new mongoose.model("register", employeeSchema);
module.exports = Register;
