const express = require("express");
const adminRouter = express.Router();
const {
  register,
  updateDetail,
  deleteDetail,
  getRoomDetail,
  getStudentDetails,
} = require("../controllers/admin-controller");
const { getDetail } = require("../controllers/student-controller");
const {
  bookingConfirmation,
  bookingCancel,
} = require("../controllers/pending-controller");
const {
  gatePassAllowance,
  getRequest,
} = require("../controllers/gate-pass-controller");

// defining admin route
adminRouter.route("/add").post(register);
adminRouter.route("/get-detail/:registrationNumber").get(getDetail);
adminRouter.route("/update-detail/:registrationNumber").patch(updateDetail);
adminRouter.route("/:registrationNumber").delete(deleteDetail);
adminRouter.route("/get-room-allocation-detail").get(getRoomDetail);
// adminRouter.route("/allocate-room/:registrationNumber").post(allocateRoom);
adminRouter
  .route("/booking-confirmation/:registrationNumber")
  .post(bookingConfirmation);
adminRouter.route("/cancel-booking/:registrationNumber").post(bookingCancel);
adminRouter
  .route("/gate-pass-confirmation/:registrationNumber")
  .post(gatePassAllowance);

adminRouter.route("/gate-pass-request").get(getRequest)

// getting students info:
adminRouter.route('/total-students').get(getStudentDetails)

module.exports = adminRouter;
