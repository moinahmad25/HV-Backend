const {Schema, model} = require("mongoose");

const passSchema = new Schema({
  registrationNumber: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  hostelName: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: Number,
    required: true,
  },
  passCode: {
    type: Number,
    default: ''
  },
  date: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  userType: {
    type: String,
    default: "",
  },
  purpose: {
    type: String,
    required: true
  },
  isAllowed: {
    type: Boolean,
    default: false
  }
});


const GetPassConfirmation = model('GatePass', passSchema)

module.exports = GetPassConfirmation;