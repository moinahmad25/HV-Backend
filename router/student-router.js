const express = require("express");
const multer = require("multer");
const uuid = require("uuid");

const {
  login,
  getDetail,
  otpGenerate,
  otpVerification,
  resendOTP,
  uploadImage,
  getImage,
} = require("../controllers/student-controller");
const { uploadReceipt } = require("../controllers/pending-controller");
const { applyGatePass } = require("../controllers/gate-pass-controller");

const studentRouter = express.Router();

const uploader = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 1024 * 1024 * 10 },
});

// defining student route
studentRouter.route("/login").post(login);
studentRouter.route("/:registrationNumber").get(getDetail);
studentRouter.route("/:registrationNumber/generate-otp").post(otpGenerate);
studentRouter
  .route("/:registrationNumber/otp-verification")
  .post(otpVerification);
studentRouter.route("/:registrationNumber/resend-otp").post(resendOTP);
studentRouter.post(
  "/add-image/:registrationNumber",
  uploader.single("file"),
  uploadImage
);
studentRouter.post(
  "/add-receipt/:registrationNumber",
  uploader.single("receipt"),
  uploadReceipt
);
studentRouter.get(
  "/get-image/:registrationNumber",
  uploader.single("file"),
  getImage
);

studentRouter.route("/apply-gate-pass/:registrationNumber").post(applyGatePass);

module.exports = studentRouter;
