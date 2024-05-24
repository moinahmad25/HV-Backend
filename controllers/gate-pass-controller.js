const AllocatedStudent = require("../models/allocated");
const GetPassConfirmation = require("../models/gatePassSchema");
const nodemailer = require('nodemailer');

const applyGatePass = async (req, res) => {
  const { registrationNumber } = req.params;
  const { date, purpose } = req.body;

  try {
    const isExist = await AllocatedStudent.findOne({ registrationNumber });

    if (!isExist) {
      return res
        .status(409)
        .json({
          status: "failed",
          message:
            "You are not a hosteler yet. Gate pass is applicable only for the hostelers.",
        });
    }

    await AllocatedStudent.updateOne(
      { registrationNumber, isApplied: false },
      { $set: { isApplied: true } }
    );

    const isUserApplied = await GetPassConfirmation.findOne({
      registrationNumber,
    });

    if (!isUserApplied) {
      await GetPassConfirmation.create({
        registrationNumber,
        userName: isExist.userName,
        userEmail: isExist.userEmail,
        hostelName: isExist.hostelName,
        roomNumber: isExist.roomNumber,
        date,
        userType: "Gate Pass",
        purpose,
      });
      return res.status(201).json({
        status: "created",
        message:
          "You are successfully applied for gate pass. You will get a message of confirmation as soon as possible.",
      });
    }
    else{
      return res.status(400).json({status:'Failed', message: "you've already applied, wait for some time, you will get the message soon."})
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: "failed", message: "server not running!!!" });
  }
};

const gatePassAllowance = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const isUserExist = await AllocatedStudent.findOne({ registrationNumber });
    console.log(isUserExist)
    if (!isUserExist) {
      return res.status(401).json({
        status: "failed",
        message:
          "Your gate pass has been cancelled because you are not a hosteler.",
      });
    }

    // Check for an existing pass
    const existUserInGatePassDb = await GetPassConfirmation.findOne({
      registrationNumber,
    });

    if (existUserInGatePassDb && existUserInGatePassDb.expiresAt > new Date()) {
      return res
        .status(409)
        .json({
          status: "rejected",
          message: "your gate pass is already allowed and is still valid.",
        });
    }

    if (
      existUserInGatePassDb &&
      existUserInGatePassDb.expiresAt <= new Date()
    ) {
      await GetPassConfirmation.deleteOne({ registrationNumber });
      existUserInGatePassDb = null;
    }

    // Generate a new pass
    const uniqueDigit = Math.floor(10000000 + Math.random() * 90000000);
    const expiresAt = new Date(Date.now() + 86400000); // 24 hours from now

    if (existUserInGatePassDb) {
       await GetPassConfirmation.updateOne(
        { registrationNumber },
        { passCode: uniqueDigit, expiresAt, isAllowed: true }
      );
    }

    const isUserAllowed = await GetPassConfirmation.findOne({registrationNumber})

    // sending mail to the user with its code:
    const config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      }
    }

    // creating the transporter
    const transporter = nodemailer.createTransport(config);

    const message = {
      from: process.env.EMAIL,
      to: isUserAllowed.userEmail,
      subject: "Gate Pass Allowed!!!",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gate Pass Confirmation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .unique_code{
          padding: 8px 12px;
          border-radius: 5px;
          background: lightgray;
          color: black;
          font-weight: 600;
          text-align: center;
        }
        .code{
          font-weight: 900;
          color: dodgerblue;
          font-size: 2.4rem;
        }
        .valid{
          color: red;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Gate Pass Confirmation</h1>
        <p>Your gate pass request has been allowed by the admin.</p>
        <p>Please verify this below unique code with the security guard at the gate.</p>
        <br /><br />
        <h2 class="unique_code">Your Gate Pass code is: <span class="code">${uniqueDigit}</span></h2>
        <p class="valid">*This code is valid till 24 hours.*</p>
        <br /><br />
        <p>If you have any questions, feel free to contact us.</p>
    </div>
</body>
</html>

`,
    };

    // transporting the mail
    await transporter.sendMail(message);

    return res.status(201).json({
      status: "created",
      message: "Your gate pass has been granted. This is valid for one day.",
      passCode: uniqueDigit,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      status: "failed",
      message: "Gate pass generation has failed. Server is not running.~",
      error: error.message,
    });
  }
};

const getRequest = async (req, res) => {
  try {
    const isApplied = await GetPassConfirmation.find({isAllowed: false})

    if(isApplied){
      return res.status(200).json({status:'Found', message: 'Gate pass data found.', user: isApplied})
    }
  } catch (error) {
    return res.status(500).json({status:'Failed', message: "server not running!!!"})
  }
}

module.exports = { gatePassAllowance, applyGatePass, getRequest };
