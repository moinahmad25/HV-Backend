const { Schema, model } = require("mongoose");

const bookedRoomSchema = new Schema({
    hostelName: {
        type: String,
        required: true,
    },
    allocatedRoomNumbers: [String]
})

const ConfirmBooking = model("Confirm", bookedRoomSchema);

module.exports = ConfirmBooking;