const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

const uploadFile = async(filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath)
        console.log(result)
        return result;
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {uploadFile}