const {Schema, model} = require('mongoose')

const allocatedSchema = new Schema({
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
  userType: {
    type: String,
  },
  isAllocated: {
    type: Boolean,
  },
  floorNumber: {
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
  imgURL: {
    type: String,
    default: "",
  },
  isApplied: {
    type: Boolean,
    default: false
  }
});

const AllocatedStudent = model('AllocatedStudent', allocatedSchema)

module.exports = AllocatedStudent;