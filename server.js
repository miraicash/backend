if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const express = require("express");
var mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session");
var cors = require("cors");
// const database = require("./components/database");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.MAIN_URL.split(" ") || "http://localhost:3000" }));
app.use(express.static(__dirname));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "localsecretkey",
        cookie: { maxAge: 1000 * 60 * 60 * 24 /** 24 hours */ },
        saveUninitialized: false,
        resave: false,
        cookie: { secure: false },
    })
);

mongoose.connect(process.env.MONGO_URL, function (err) {
    if (err) throw err;
    console.log("Successfully connected to MongoDB");
});

app.get("/", (req, res) => {
    try {
        res.json({ message: "API Route working." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const usersRouter = require("./routes/users");
const paymentsRouter = require("./routes/payments");
app.use("/users", usersRouter);
app.use("/payments", paymentsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${PORT}`);
});
