const AddModel = require("../models/addSchema"); // DB model, storing the details of the students
const nodemailer = require("nodemailer"); // for sending the otp to the mail
const StudentModel = require("../models/studentSchema"); // DB model for otp and adding the room
const bcrypt = require("bcryptjs"); // for hashing the otp
const { uploadFile } = require("../middleware/cloudinary.middleware");
const Room = require("../models/pendingBookingSchema");

//                                             FUNCTIONALITIES

// ----------------------------------------------- login ---------------------------------------------------

const login = async (req, res) => {
  try {
    const { registrationNumber } = req.body;

    const isRegistrationValid = await AddModel.findOne({ registrationNumber });

    if (!isRegistrationValid) {
      res.status(400).json("login failed!!! try again");
    } else {
      res.status(200).json({
        status: "Success",
        message: "Verification successful!!!",
        token: await isRegistrationValid.generateToken(),
        userId: isRegistrationValid._id.toString(),
        email: isRegistrationValid.email,
      });
    }
  } catch (error) {
    return res.status(401).json({
      status: "Failed",
      message: "something went wrong, verification failed!!!",
      error,
    });
  }
};

// --------------------------------------------getting details ----------------------------------------------

const getDetail = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const isRegistrationValid = await AddModel.findOne({ registrationNumber });
    const isUserApplied = await Room.findOne({ registrationNumber });

    if (!isRegistrationValid) {
      res.status(400).json("login failed!!! try again");
    } else {
      if (isUserApplied) {
        res.status(200).json({ isRegistrationValid, isUserApplied });
      } else {
        res.status(200).json({ isRegistrationValid });
      }
    }
  } catch (error) {
    return res.status(401).json("something went wrong, otp not sent!!!", error);
  }
};

// ------------------------------------------- otp generate -----------------------------------------------

const otpGenerate = async (req, res) => {
  const { registrationNumber } = req.params;
  const otp = Math.floor(100000 + Math.random() * 900000); //generate 6 digit code

  try {
    const isRegistrationValid = await AddModel.findOne({ registrationNumber });
    if (isRegistrationValid) {
      let config = {
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      };

      let transporter = nodemailer.createTransport(config);

      let message = {
        from: process.env.EMAIL,
        to: isRegistrationValid.email,
        subject: "OTP verification!!! from HSM.",
        html: ` <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OTP Verification</title>
                </head>
                <body>
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1>One-Time Password (OTP) for Account Verification</h1>
                    <p>Dear ${isRegistrationValid.firstName} ${isRegistrationValid.lastName},</p>
                    <p>Thank you for choosing our platform for your registration. To ensure the security of your account and protect your information, we have generated a One-Time Password (OTP) for verification purposes.</p>
                    <p style="background-color: #f5f5f5; padding:14px 10px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center;">Your OTP code is: ${otp}</p>
                    <p>Please use this code within the next 1 hour to complete the verification process. Do not share this OTP with anyone for your safety.</p>
                    <p>If you did not request this OTP or have any concerns about your account security, please contact our support team immediately.</p>
                    <p>Thank you for your cooperation.</p>
                    <p>Best regards,<br>Moin Ahmad<br>Admin</p>
                  </div>
                </body>
                </html>`,
      };

      // hashing the otp
      const saltRound = 10;
      const hashed_otp = await bcrypt.hash(otp.toString(), saltRound);

      // setting the details to the DB
      const addDetail = await new StudentModel({
        registrationNumber,
        email: isRegistrationValid.email,
        otp: hashed_otp,
        createdAt: new Date(Date.now()),
        expiresAt: new Date(Date.now() + 3600000),
      });

      // saving to the DB
      await addDetail.save();

      // sending the otp mail to the user
      await transporter.sendMail(message);

      // res after success
      res
        .status(201)
        .json({ status: "pending!!!", msg: "otp sent successfully!!!" });
    } else {
      // means registration number is not valid
      res
        .status(404)
        .json({ status: "failed!!! ", msg: "Registration number not found" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      status: "failed!!!",
      msg: "otp not sent!!!",
      error: error.message,
    });
  }
};

// -----------------------------------------  otp verification  ----------------------------------------------

const otpVerification = async (req, res) => {
  // getting the registrationNumber from the route path
  const { registrationNumber } = req.params;
  const { otp } = req.body;

  // if the both fields are empty
  if (!registrationNumber || !otp) {
    res.status(400).json({status:'failed', msg: "Please enter the OTP before proceeding." });
  } else {
    try {
      // collecting the user info from DB in the form of array using ".find({})" method
      const isVerified = await StudentModel.find({ registrationNumber });

      // if the information is empty
      if (isVerified.length <= 0) {
        res.status(400).json({
          status: "failed",
          msg: "Account record does'nt exist or has been already verified!!!, please sign up or log in.",
        });
      } else {
        // if it is not empty, then
        // checking expiry date and time
        const { expiresAt } = isVerified[0];
        const hashed_otp = isVerified[0].otp;

        // if the otp has been expired???
        if (expiresAt < Date.now()) {
          // then delete the record from the DB first
          await StudentModel.deleteMany({ registrationNumber });

          res.status(400).json({
            status: 'failed',msg: "The OTP has been expired, please click on resend button.",
          });
        } else {
          // if the otp has not been expired, then check the otp by comparing it to hashed form
          const otp_response = await bcrypt.compare(otp, hashed_otp);

          // if otp is wrong
          if (!otp_response) {
            res
              .status(400)
              .json({status: 'failed', msg: "OTP is wrong, please check your inbox again!!!" });
          } else {
            // if the otp entered not wrong, then update the main DB of ADMIN RECORD, isVerified to "true"
            await AddModel.updateOne(
              { registrationNumber },
              { isVerified: true }
            );

            // after updating the value, delete the otp records from the DB
            await StudentModel.deleteMany({ registrationNumber });

            res.status(200).json({
              status: "verified",
              msg: "Your OTP has been verified!!! You can now log in.",
            });
          }
        }
      }
    } catch (error) {
      res.status(404).json({
        status: "failed",
        msg: "registration not found!!!",
        error: error.message,
      });
    }
  }
};

// -------------------------------------------- resend otp ------------------------------------------------

const resendOTP = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    if (!registrationNumber) {
      res.status(400).json({ msg: "Empty user details are not allowed!!!" });
    } else {
      // first delete the data from DB
      await StudentModel.deleteMany({ registrationNumber });
      await otpGenerate(req, res);
    }
  } catch (error) {
    res.status(404).json({
      status: "failed",
      msg: "registration not found!!!",
      error: error.message,
    });
  }
};

// ---------------------------------------- uploading profile image --------------------------------------------

const uploadImage = async (req, res) => {
  const { registrationNumber } = req.params;

  if (req.fileTooLarge) {
    return res.status(413).json({ message: "File size exceeds the limit." });
  }

  try {
    const upload = await uploadFile(req.file.path);
    const student = await AddModel.findOneAndUpdate(
      { registrationNumber },
      { imageURL: upload.secure_url },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res
      .status(200)
      .json({ message: "Image uploaded successfully", student });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------------------------------- getting profile image --------------------------------------------

const getImage = async (req, res) => {
  const { registrationNumber } = req.params;

  try {
    const isExist = await AddModel.findOne({ registrationNumber });

    if (isExist) {
      res.status(200).json(isExist.imageURL);
    } else {
      res
        .status(401)
        .json({ status: "failed!!!", message: "User doesn't exist!!!" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ status: "failed", message: "Registration number not valid!!!" });
  }
};

module.exports = {
  login,
  getDetail,
  otpGenerate,
  otpVerification,
  resendOTP,
  uploadImage,
  getImage,
};
