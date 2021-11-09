if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
var mongoose = require("mongoose");
var User = require("../models/user");
const express = require("express");
const router = express.Router();

mongoose.connect(process.env.MONGO_URL, function (err) {
    if (err) throw err;
    console.log("Successfully connected to MongoDB");
});

//General route
router.get("/", async (req, res) => {
    try {
        res.json({ message: "API Route working." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Logging in route
router.post("/login", (req, res) => {
    try {
        if (!req.body || !req.body.username || !req.body.password) throw new Error("Missing username or password");
        console.log(req.body);
        User.findOne({ username: req.body.username }, function (err, user) {
            if (err || !user) return res.status(500).json({ message: "Invalid username or password" });
            // test a matching password
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (err) return res.status(500).json({ message: "Error while logging in: " + err });
                console.log("Password match?:", isMatch);
                console.log(user);
                res.status(201).json({ message: "Successfully logged in.", user: user });
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Signing up route
router.post("/signup", async (req, res) => {
    try {
        if (!req.body || !req.body.username || !req.body.password) throw new Error("Missing username or password");
        if (req.body.username.length < 3) throw new Error("Username must be at least 3 characters long");
        if (req.body.password.length < 9) throw new Error("Password must be at least 9 characters long");
        // create a user a new user
        var newUser = new User({
            username: req.body.username,
            password: req.body.password,
        });

        // save the user to database
        await newUser.save((err) => {
            if (err) throw new Error(err);
        });
        res.status(201).json({ message: "User created." });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
