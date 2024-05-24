// requiring schema and model from mongoose to create DB
const { Schema, model } = require("mongoose");

const otpSchema = new Schema({
  registrationNumber: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  otp: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

// creating model
const StudentModel = new model("Student_Detail", otpSchema);

module.exports = StudentModel;
