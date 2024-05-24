const {Schema, model} = require("mongoose")

// creating schema first

const pendingBooking = new Schema({
    registrationNumber: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userType: {
        type: String,
    },
    isAllocated: {
        type: Boolean,
        default: false,
    },
    floorNumber: {
        type: String,
        required: true
    },
    hostelName: {
        type: String,
        required: true,
    },
    roomNumber: {
        type: Number,
        required: true
    },
    imgURL: {
        type: String,
        default: ''
    }, 
    college: {
        type: String,
        required: true,
    }
})


// creating a model out of it
const Room = new model("Room", pendingBooking)


// exporting the model
module.exports = Room