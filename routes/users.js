if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
var User = require("../models/user");
const express = require("express");
const router = express.Router();

//General route
router.get("/", async (req, res) => {
    try {
        res.json({ message: `Users API Route working... Logged in status: ${req.session.loggedIn ? req.session.user.username : "No session"}` });
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
        if (!req.body) return res.status(400).json({ message: "Missing payload" });
        let { username, password, firstName, lastName, debitCardNumber, debitCardCVV, debitCardExpiry, debitCardZip } = req.body;
        if (!username || !password) return res.status(400).json({ message: "Missing username or password" });
        if (!firstName || !lastName) return res.status(400).json({ message: "Missing name" });
        if (!debitCardNumber || !debitCardCVV || !debitCardExpiry || !debitCardZip) return res.status(400).json({ message: "Missing card details" });
        if (!(username.length >= 3 && username.length <= 50)) return res.status(400).json({ message: "Username must be at least 3 to 50 characters long" });
        if (!/\S+@\S+\.\S+/.test(username)) return res.status(400).json({ message: "Username must be a valid email address" });
        if (password.length < 9) return res.status(400).json({ message: "Password must be at least 9 characters long" });
        if (!(debitCardNumber.length >= 15 && debitCardNumber.length <= 16))
            return res.status(400).json({ message: "Debit card number must be 15 to 16 characters long" });
        if (!(debitCardCVV.length >= 3 && debitCardCVV.length <= 4)) return res.status(400).json({ message: "Debit card CVV must be 3 to 4 characters long" });
        if (!debitCardExpiry.includes("/") || debitCardExpiry.length !== 5) return res.status(400).json({ message: "Debit card expiry date is incorrect" });
        if (debitCardZip.length !== 5) return res.status(400).json({ message: "Debit card zip code is incorrect" });
        // create a user a new user
        var newUser = new User({
            username: username,
            password: password,
            firstName: firstName,
            lastName: lastName,
            cashFunding: {
                debitCardNumber: debitCardNumber,
                debitCardCVV: debitCardCVV,
                debitCardExpiry: debitCardExpiry,
                debitCardZip: debitCardZip,
            },
            transactions: {
                cash: [],
                crypto: [],
            },
            wallet: {
                // Use the default generated values from the user.js model
                card: {
                    number: undefined,
                    cvv: undefined,
                    expiry: undefined,
                },
                balance: {
                    cash: undefined,
                    crypto: undefined,
                },
            },
        });

        // save the user to database
        return await newUser.save((err) => {
            if (err && err.message.startsWith("E11000")) return res.status(400).json({ message: "Account already exists" });
            else {
                req.session.loggedIn = true;
                req.session.user = newUser;
                return res.status(200).json({ message: "User created.", username: newUser.username });
            }
        });
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
            user.password = undefined;
            user.cashFunding.debitCardNumber = user.decryptCard(user.cashFunding.debitCardNumber);
            user.cashFunding.debitCardNumber = user.cashFunding.debitCardNumber.replace(/\d(?=\d{4})/g, "*"); // replace card number with *
            user.wallet.card.number = user.decryptCard(user.wallet.card.number);
            user.transactions.cash = user.transactions.cash.slice(0).slice(-10);
            res.status(200).json({ message: "User found.", user: user });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Get user transactions with pagination
router.get("/transactions", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { page, currency } = req.query;
        if (!page) return res.status(400).json({ message: "Missing page number" });
        if (currency !== "cash" || currency !== "crypto") return res.status(400).json({ message: "Invalid currency" });
        User.findOne({ username: req.session.user.username }, { skip: page * 10, limit: 10 }, (err, user) => {
            if (err || !user) return res.status(400).json({ message: "User not found" });
            user.transactions[currency] = user.transactions[currency].slice(0).slice(-10);
            res.status(200).json({ message: `Transactions retrieved [Page ${page}].`, transactions: user.transactions[currency], currency });
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Modify details of user
//Accepts a JSON payload with the following fields:
//modifiedUser: { All modified fields }
router.post("/modify", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { modifiedUser } = req.body;
        console.log(modifiedUser);
        if (!modifiedUser || Object.keys(modifiedUser).length === 0) return res.status(400).json({ message: "No settings to modify" });
        let modifiedList = Object.keys(modifiedUser);
        let modificationsAllowed = ["firstName", "lastName", "password", "debitCardNumber", "debitCardCVV", "debitCardExpiry", "debitCardZip"];
        if (modifiedList.length > 7) return res.status(400).json({ message: "Too many fields to modify" });
        for (let i = 0; i < modifiedList.length; i++) {
            if (modifiedUser[modifiedList[i]] === undefined || !modificationsAllowed.includes(modifiedList[i]))
                return res.status(400).json({ message: "Invalid modification: " + modifiedList[i] });
            if (modifiedList[i] === "firstName" && modifiedUser[modifiedList[i]] && modifiedUser[modifiedList[i]].length < 2)
                return res.status(400).json({ message: "First name must be at least 2 characters long" });
            if (modifiedList[i] === "lastName" && modifiedUser[modifiedList[i]] && modifiedUser[modifiedList[i]].length < 2)
                return res.status(400).json({ message: "Last name must be at least 2 characters long" });
            if (
                modifiedList[i] === "password" &&
                modifiedUser[modifiedList[i]] &&
                Array.isArray(modifiedUser[modifiedList[i]]) &&
                modifiedUser[modifiedList[i]][0].length < 9
            )
                return res.status(400).json({ message: "Password must be at least 9 characters long" });
            if (
                modifiedList[i] === "password" &&
                modifiedUser[modifiedList[i]] &&
                Array.isArray(modifiedUser[modifiedList[i]]) &&
                modifiedUser[modifiedList[i]][1] &&
                modifiedUser[modifiedList[i]][1].length < 9
            )
                return res.status(400).json({ message: "Password must be at least 9 characters long" });
            if (modifiedList[i] === "debitCardNumber")
                if (modifiedUser[modifiedList[i]].length < 15 || modifiedUser[modifiedList[i]].length > 16)
                    return res.status(400).json({ message: "Debit card number must be 15 to 16 characters long" });
            if (modifiedList[i] === "debitCardCVV" && modifiedUser[modifiedList[i]].length < 3 && modifiedUser[modifiedList[i]].length > 4)
                return res.status(400).json({ message: "Debit card CVV must be 3 to 4 characters long" });
            if (modifiedList[i] === "debitCardExpiry" && (!modifiedUser[modifiedList[i]].includes("/") || modifiedUser[modifiedList[i]].length !== 5))
                return res.status(400).json({ message: "Debit card expiry date is incorrect" });
            if (modifiedList[i] === "debitCardZip" && modifiedUser[modifiedList[i]].length !== 5)
                return res.status(400).json({ message: "Debit card zip code is incorrect" });
        }
        User.findOne({ username: req.session.user.username }, (err, user) => {
            if (err || !user) return res.status(400).json({ message: "Invalid username or password" });
            user.comparePassword(modifiedUser["password"][0], (err, isMatch) => {
                if (err) return res.status(400).json({ message: "Error while logging in: " + err.message });
                if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });
                user.firstName = modifiedUser["firstName"] ? modifiedUser["firstName"] : user.firstName;
                user.lastName = modifiedUser["lastName"] ? modifiedUser["lastName"] : user.lastName;
                if (modifiedUser["password"][1]) {
                    user.password = modifiedUser["password"][1];
                }
                user.cashFunding.debitCardNumber = modifiedUser["debitCardNumber"]
                    ? modifiedUser["debitCardNumber"]
                    : user.decryptCard(user.cashFunding.debitCardNumber);
                user.cashFunding.debitCardCVV = modifiedUser["debitCardCVV"] ? modifiedUser["debitCardCVV"] : user.cashFunding.debitCardCVV;
                user.cashFunding.debitCardExpiry = modifiedUser["debitCardExpiry"] ? modifiedUser["debitCardExpiry"] : user.cashFunding.debitCardExpiry;
                user.cashFunding.debitCardZip = modifiedUser["debitCardZip"] ? modifiedUser["debitCardZip"] : user.cashFunding.debitCardZip;
                user.save((err) => {
                    if (err) return res.status(400).json({ message: "Error saving user: " + err.message });
                    res.status(200).json({ message: "User details updated." });
                });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
