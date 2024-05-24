// const { response } = require("express");
const { uploadFile } = require("../middleware/cloudinary.middleware");
const AddModel = require("../models/addSchema"); // DB model, storing the details of the students
const Room = require("../models/pendingBookingSchema");
const nodemailer = require("nodemailer");
const ConfirmBooking = require("../models/confirmBooking");
const AllocatedStudent = require("../models/allocated");

const pendingController = async (req, res) => {
  const { registrationNumber } = req.params;
  const { floorNumber, hostelName, roomNumber, userType } = req.body;

  const isUserExist = await AddModel.findOne({ registrationNumber });
  const isUserApplied = await Room.findOne({ registrationNumber });

  try {
    if (isUserExist) {
      if (isUserApplied) {
        return res.status(400).json({
          status: "Failed!!!",
          message: "seems like you have already applied for it!!!",
        });
      } else {
        await Room.create({
          registrationNumber,
          userName: `${isUserExist.firstName} ${isUserExist.lastName}`,
          userEmail: isUserExist.email,
          userType: 'Room Booking',
          floorNumber,
          hostelName,
          roomNumber,
          college: isUserExist.college
        });
        return res.status(201).json({
          status: "Pending!!!",
          message: "You have successfully applied for a room.",
          user: `${isUserExist.firstName} ${isUserExist.lastName}`,
        });
      }
    }
  } catch (error) {
    return res
      .status(400)
      .json({ status: "Failed!!!", message: "User is not exist!!!", error });
  }
};

const uploadReceipt = async (req, res) => {
  const { registrationNumber } = req.params;

  // checking if file is large
  if (req.fileTooLarge) {
    return res.status(413).json({ message: "File size exceeds the limit." });
  }

  try {
    const uploadReceipt = await uploadFile(req.file.path);
    const feeReceipt = await Room.findOneAndUpdate(
      { registrationNumber },
      { imgURL: uploadReceipt.secure_url },
      { new: true }
    );

    if (!feeReceipt) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res
      .status(200)
      .json({ message: "Image uploaded successfully", feeReceipt });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// config
const config = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

const bookingConfirmation = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const isUserExist = await Room.findOne({ registrationNumber });
    console.log(isUserExist);
    if (isUserExist) {
      // creating transporter for sending the mail to the user.
      const transporter = nodemailer.createTransport(config);

      // creating message inbox
      let message = {
        from: process.env.EMAIL,
        to: isUserExist.userEmail,
        subject: "Booking Confirmed!!!",
        html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Booking Confirmation</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 20px;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  }
                  h1 {
                    color: #333;
                    text-align: center;
                  }
                  p {
                    font-size: 16px;
                    line-height: 1.6;
                  }
                  b {
                    color: #007bff;
                  }
                </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Booking Confirmation</h1>
                    <p>Hello <b>${isUserExist.userName}</b>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">Hello <b>${isUserExist.userName}</b>, we are delighted to inform you that your booking for Room No. <b>${isUserExist.roomNumber}</b> in <b>${isUserExist.hostelName}</b> has been successfully confirmed. You can expect a comfortable stay and excellent service during your visit. Should you have any questions or need further assistance, please don't hesitate to reach out to us. We look forward to welcoming you soon!</p>
                  </div>
                </body>
                </html>
`,
      };

      if (isUserExist.imgURL !== "") {
        const { roomNumber, hostelName } = isUserExist;
        const updatedRoom = await Room.updateOne(
          { registrationNumber }, // Use the document ID for update
          { isAllocated: true },
          { new: true }
        );

        console.log("updated Room", updatedRoom);

        const pushToBookedRooms = await ConfirmBooking.findOneAndUpdate(
          { hostelName },
          { $addToSet: { allocatedRoomNumbers: String(roomNumber) } },
          { new: true, upsert: true }
        );

        console.log("pushing to booked room", pushToBookedRooms);
        // sending all allocated student to a separate collection
        const room = await Room.find({registrationNumber, isAllocated: true });

        const sendTo = await AllocatedStudent.insertMany(room);

        console.log("rooms", room);
        console.log("allocated student", sendTo);

        // after all these, we will send the message to the student
        await transporter.sendMail(message);

        return res.status(201).json({
          status: "confirmed!!!",
          message: "You will get the message soon.",
          isUserExist,
        });
      } else {
        const transporter = nodemailer.createTransport(config);

        // creating the message inbox
        const message = {
          from: process.env.EMAIL,
          to: isUserExist.userEmail,
          subject: "Booking Cancelled!!!",
          html: `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Booking Cancellation</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f5f5f5;
                      margin: 0;
                      padding: 20px;
                    }
                    .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background-color: #fff;
                      border-radius: 10px;
                      padding: 20px;
                      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                      color: #333;
                      text-align: center;
                    }
                    p {
                      font-size: 1rem;
                      color: gray;
                      line-height: 1.6;
                    }
                    b {
                      color: black;
                      font-size: 1.3rem;
                    }
                    .reason {
                      text-transform: uppercase;
                    }
                    .note {
                      color: red;
                      font-size: 0.95rem;
                      font-weight: 500;
                    }
                  </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>Booking Cancellation</h1>
                      <p>Hey <b>${isUserExist.userName}</b>,</p>
                      <p>Your booking for Room no. <b>${isUserExist.roomNumber}</b> in <b class="reason">${isUserExist.hostelName}</b> has been cancelled by admin.</p>
                      <p>Reason behind this cancellation is that you did not upload the necessary document yet.</p>
                      <br>
                      <span class="note">*please upload the fee receipt by simply going to your <b>PROFILE</b> first.*</span>
                      <br><br>
                      <p>For more queries, reply or message me to this Email, I would like to help you 😊.</p>
                    </div>
                  </body>
                  </html>
`,
        };

        await transporter.sendMail(message);

        return res.status(400).json({
          status: "failed!!!",
          message: "user has not uploaded the fee receipt!!!",
          isUserExist,
        });
      }
    } else {
      return res
        .status(400)
        .json({ status: "Failed!!!", message: "User does not exist." });
    }
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern._id) {
      // Handle duplicate _id error
      console.error("Duplicate _id error:", error);
      // Generate a new unique _id and retry insertion
      const newDocument = new AllocatedStudent({
        /* new document data */
      });
      await newDocument.save(); // Example: Save the new document
      return res.status(500).json({
        status: "Failed!!!",
        message: "Duplicate key error, retrying with a new _id.",
        error: error.message,
      });
    } else {
      // Handle other errors
      console.error("Error in bookingConfirmation:", error);
      return res.status(400).json({
        status: "Failed!!!",
        message: "There is something wrong!!!",
        error: error.message, // Include the error message in the response for debugging
      });
    }
  }
};

const bookingCancel = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const isUserExist = await Room.findOne({ registrationNumber });

    if (isUserExist) {
      // creating transporter for sending the email after cancellation
      const transporter = nodemailer.createTransport(config);

      // creating the message inbox
      const message = {
        from: process.env.EMAIL,
        to: isUserExist.userEmail,
        subject: "Booking Cancelled!!!",
        html: `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Booking Cancellation</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f5f5f5;
                      margin: 0;
                      padding: 20px;
                    }
                    .container {
                      max-width: 600px;
                      margin: 0 auto;
                      background-color: #fff;
                      border-radius: 10px;
                      padding: 20px;
                      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                      color: #333;
                      text-align: center;
                    }
                    p {
                      font-size: 1rem;
                      color: gray;
                      line-height: 1.6;
                    }
                    b {
                      color: black;
                      font-size: 1.3rem;
                      text-transform: uppercase;
                    }
                    .note {
                      color: red;
                      font-size: 0.95rem;
                      font-weight: 500;
                    }
                  </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>Booking Cancellation</h1>
                      <p>Hey <b>${isUserExist.userName}</b>,</p>
                      <p>Your booking for Room no. <b>${isUserExist.roomNumber}</b> in <b class="reason">${isUserExist.hostelName}</b> has been cancelled by admin.</p>
                      <p>Reason behind this cancellation is that you did not upload the necessary document yet.</p>
                      <br>
                      <span class="note">*please upload the fee receipt by simply going to your <b>PROFILE</b> first.*</span>
                      <br><br>
                      <p>For more queries, reply or message me to this Email, I would like to help you 😊.</p>
                    </div>
                  </body>
                  </html>`,
      };

      transporter.sendMail(message);

      return res.status(201).json({
        status: "Ok",
        message: "cancellation message sent to user's mail.",
      });
    }
  } catch (error) {
    return res
      .status(400)
      .json({ status: "Failed!!!", message: "message did't sent.", error });
  }
};

module.exports = {
  pendingController,
  uploadReceipt,
  bookingConfirmation,
  bookingCancel,
};
