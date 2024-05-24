// requiring schema and model from mongoose to create DB
const {Schema, model} = require("mongoose")
const jwt = require("jsonwebtoken")


// defining schema of adding student
const studentSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: false,
  },
  registrationNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  college: {
    type: String,
    required: true,
  },
  permanentAddress: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  imageURL: {
    type: String, // Assuming you'll store the URL as a string
    default:""
  },
});

studentSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      userId: this._id.toString(),
      registrationNumber: this.registrationNumber,
      email: this.email,
    },
    process.env.MY_SECRET_KEY,
    {
      expiresIn: "30d",
    }
  );
};

// creating a model
const AddModel = new model("Student", studentSchema)


module.exports = AddModel

