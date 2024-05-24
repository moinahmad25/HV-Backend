const ConfirmBooking = require("../models/confirmBooking")


const confirmedRooms = async (req, res) => {
    try {
        const rooms = await ConfirmBooking.find()
        return res.status(200).json({status:"OK", message: rooms})
        
    } catch (error) {
        return res.status(400).json({status:"False", message: error})
        
    }
}

module.exports = {confirmedRooms}