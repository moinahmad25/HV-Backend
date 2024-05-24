// requiring .env to protect the sensitive info
require("dotenv").config();

// requiring express
const express = require("express");
// passing instance to app
const cors = require("cors")
const app = express();

// requiring cors

// requiring files
const adminRouter  = require("./router/admin-router");
const connectDB = require("./utils/db");
const studentRouter = require("./router/student-router");
const roomRouter = require("./router/room-router");


// tackling server differences with cors
const corsOption = {
  origin: [
    "http://localhost:5173", // Allow local development
    "https://hv-frontend.vercel.app", // Allow Vercel deployment
  ],
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
};

app.use(cors(corsOption));

app.options('*', cors(corsOption)); // Enable pre-flight for all routes



// .json to parse the normal object file to json
app.use(express.json());

// main routing for admin
app.use("/api/admin/", adminRouter);
app.use("/api/form/", studentRouter);
app.use("/api/user/", roomRouter);

// define port
const PORT = 5000;

// make connection if it connected to the DB
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`app is running successfully at PORT: ${PORT}`)
    })
})