const mongoose = require("mongoose")

// getting db url
const dbURL = process.env.DATABASE_URL;

const connectDB = async() => {
    try {
        await mongoose.connect(dbURL)
        console.log("DB connected successfully!!!")
    } catch (error) {
        console.log("DB connection failed!!! ", error)
        process.exit(0)
    }
}


module.exports = connectDB