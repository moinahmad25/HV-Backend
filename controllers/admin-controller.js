// requiring schema
const AddModel = require('../models/addSchema');
const ConfirmBooking = require('../models/confirmBooking');
const Room = require('../models/pendingBookingSchema');

const register = async(req, res) => {
    try {
        const {firstName, lastName, registrationNumber, email, phone, college, permanentAddress} = req.body;

        // checking email is present or not
        const isRegistrationExist = await AddModel.findOne({registrationNumber})
        if(isRegistrationExist){
            res.status(400).json({msg:"user exist, registration number is duplicating!!!"})
        }
        else{
            const addStudent = await AddModel.create({
              firstName,
              lastName,
              registrationNumber,
              email,
              phone,
              college,
              permanentAddress,
            });
            return res.status(201).json({msg:"student data created!!!"})
        }
    } catch (error) {
        console.log("error found!!! ", error)
    }
}

const updateDetail = async(req, res) => {
    const {registrationNumber} = req.params;
    const updatedFields = req.body; // Fields to be updated sent in the request body

    try{
        // Construct the update object based on the fields to be updated
        const updateObject = {};
        for (const key in updatedFields) {
            updateObject[key] = updatedFields[key];
        }

        // Update the student's details
        await AddModel.findOneAndUpdate(
            { registrationNumber },
            { $set: updateObject },
            { new: true } // Return the updated document
        );

        res.status(201).json({status:"ok", message:"update successful!!!"})
    } catch (error) {
        res.status(401).json({ status: "failed!!!", message: "update failed!!!" });
    }
    
}

const deleteDetail = async (req, res) => {

    const {registrationNumber} = req. params;

    try {
        const isExist = await AddModel.findOne({registrationNumber})
        if(isExist){
            await AddModel.deleteOne({registrationNumber})
            res.status(200).json({status:"Success!!!", message:"Data deleted!!!"})
        }
        else{
            res.status(400).json({status:"Failed!!!", message:"User not found!!!"})
        }
    } catch (error) {
        res.status(401).json({status:"Failed!!!", message:"Operation Failed!!!"})
    }

}

const getRoomDetail = async (req, res) => {
    try {
        const userData = await Room.find({isAllocated:false})
        return res.status(200).json({status:'Found!!!', message:"Data Found!!!", user: userData})
    } catch (error) {
        return res.status(400).json({status:'Not Found!!!', message:"Data Not Found!!!"})
    }
    
}

const getStudentDetails = async (req, res) => {
  try {
    let allocatedCount = 0;
    let nonAllocatedCount = 0;
    let studentData = await Room.find({}); // Wait for the query to complete

    // getting page details
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 5;

    let skip = (page - 1) * limit; // Define skip after page and limit are defined

    const students = await Room.find({}).skip(skip).limit(limit); // Apply pagination directly to the fetched data

    studentData.map((item) => {
        if(item.isAllocated){
            allocatedCount++;
        }
        else{
            nonAllocatedCount++;
        }
    })

    res
      .status(200)
      .json({
        students,
        length: studentData,
        count: allocatedCount,
        nonAllocated: nonAllocatedCount,
      });
  } catch (error) {
    res
      .status(400)
      .json({
        status: "failed",
        message: "data not get",
        error: error.message,
      });
  }
};



module.exports = {
  register,
  updateDetail,
  deleteDetail,
  getRoomDetail,
  getStudentDetails,
};