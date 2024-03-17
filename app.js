const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const baseRouter = require("./route/route");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/v1/", baseRouter);

const port = 3000;

app.listen(port, () => {
    console.log(`App running on port ${port}...`);
    mongoose
        .connect(process.env.DATABASE)
        .then(() => console.log("DB connection successful!"))
        .catch((err) => console.error(err, "MongoDB connection"));
});
