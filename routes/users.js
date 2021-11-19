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
        res.json({ message: "API Route working... Logged in status: " + req.session.loggedIn ? req.session.user.username : "No session" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//Logging in route
router.post("/login", (req, res) => {
    try {
        console.log(req.body);
        if (!req.body || !req.body.username || !req.body.password) return res.status(400).json({ message: "Missing username or password" });
        if (!/\S+@\S+\.\S+/.test(req.body.username)) return res.status(400).json({ message: "Username must be a valid email address" });
        User.findOne({ username: req.body.username }, (err, user) => {
            if (err || !user) return res.status(400).json({ message: "Invalid username or password" });
            // test a matching password
            user.comparePassword(req.body.password, (err, isMatch) => {
                if (err) return res.status(400).json({ message: "Error while logging in: " + err.message });
                if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });
                req.session.loggedIn = true;
                delete user.password;
                req.session.user = user;
                console.log(req.sessionID);
                res.status(200).json({ message: "Successfully logged in.", user: user });
            });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//Signing up route
router.post("/signup", async (req, res) => {
    try {
        if (!req.body || !req.body.username || !req.body.password) return res.status(400).json({ message: "Missing username or password" });
        if (req.body.username.length < 3) return res.status(400).json({ message: "Username must be at least 3 characters long" });
        if (!/\S+@\S+\.\S+/.test(req.body.username)) return res.status(400).json({ message: "Username must be a valid email address" });
        if (req.body.password.length < 9) return res.status(400).json({ message: "Password must be at least 9 characters long" });
        // create a user a new user
        var newUser = new User({
            username: req.body.username,
            password: req.body.password,
        });

        // save the user to database
        await newUser.save((err) => {
            if (err) return res.status(400).json({ message: "Error saving user to database: " + err.message });
        });
        req.session.loggedIn = true;
        req.session.user = newUser;
        res.status(200).json({ message: "User created.", user: newUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Logging out route
router.post("/logout", async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) return res.status(400).json({ message: "Error logging out: " + err.message });
            res.status(200).json({ message: "Successfully logged out." });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Get user route
router.get("/info", async (req, res) => {
    try {
        console.log(req.sessionID);
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        User.findOne({ username: req.session.user.username }, (err, user) => {
            if (err || !user) return res.status(400).json({ message: "User not found" });
            delete user.password;
            res.status(200).json({ message: "User found.", user: user });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
