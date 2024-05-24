const express = require('express');
const { pendingController } = require('../controllers/pending-controller');
const { confirmedRooms } = require('../controllers/confirmed-rooms');
const roomRouter = express.Router();
// const {pendingController} = 

// defining router
roomRouter.route('/:registrationNumber/pending-room-booking').post(pendingController)
roomRouter.route('/get-confirmed-rooms').get(confirmedRooms)


module.exports = roomRouter