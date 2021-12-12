if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const { performance } = require("perf_hooks");
var Payment = require("../components/payment");
var User = require("../models/user");
const express = require("express");
const router = express.Router();
const moment = require("moment");
const fetch = require("node-fetch");

router.get("/", async (req, res) => {
    try {
        res.json({ message: `Payments API Route working... Logged in status: ${req.session.loggedIn ? req.session.user.username : "No session"}` });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//Deposit money
router.post("/deposit", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { amount, currency } = req.body;
        amount = parseFloat(amount);
        if (amount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
        if (currency === "cash") {
            var doc = await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.cash": Math.round(amount * 100) / 100 },
                    $push: {
                        "transactions.cash": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Deposit",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Incoming",
                            amount: (Math.round(amount * 100) / 100).toFixed(2),
                        },
                    },
                }
            );
        } else if (currency === "crypto") {
            var doc = await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.crypto": amount },
                    $push: {
                        "transactions.crypto": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Deposit",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Incoming",
                            amount: amount,
                        },
                    },
                }
            );
        } else {
            return res.status(400).json({ message: "Invalid currency" });
        }
        return res.status(200).json({ message: "Deposit successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

//Withdraw money
router.post("/withdraw", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { amount, currency } = req.body;
        amount = parseFloat(amount);
        if (amount <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
        var doc = await User.find({ username: req.session.user.username }).exec();
        if (currency === "cash") {
            if (doc[0].wallet.balance.cash < amount) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.cash": -amount },
                    $push: {
                        "transactions.cash": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Withdraw",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amount,
                        },
                    },
                }
            );
        } else if (currency === "crypto") {
            if (doc[0].wallet.balance.crypto < amount) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.crypto": -amount },
                    $push: {
                        "transactions.crypto": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Withdraw",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amount,
                        },
                    },
                }
            );
        } else {
            return res.status(400).json({ message: "Invalid currency" });
        }
        return res.status(200).json({ message: "Withdraw successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Send money
router.post("/send", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { amount, currency, to } = req.body;
        amount = parseFloat(amount);
        var doc = await User.find({ username: req.session.user.username }).exec();
        if (currency === "cash") {
            if (doc[0].wallet.balance.cash < amount) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.cash": -amount },
                    $push: {
                        "transactions.cash": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: to,
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amount,
                        },
                    },
                }
            );
            // Logic for sending cash to another user
            // await User.findOneAndUpdate(
            //     { username: to },
            //     {
            //         $inc: { "wallet.balance.cash": amount },
            //         $push: {
            //             "transactions.cash": {
            //                 id: parseFloat(performance.now().toString().replace(".", "")),
            //                 name: to,
            //                 date: moment().format("MM/DD/YYYY hh:mm a"),
            //                 type: "Incoming",
            //                 amount: amount,
            //             },
            //         },
            //     }
            // );
        } else if (currency === "crypto") {
            if (doc[0].wallet.balance.crypto < amount) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.crypto": -amount },
                    $push: {
                        "transactions.crypto": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: to,
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amount,
                        },
                    },
                }
            );
            // Logic for sending crypto to another user
            // await User.findOneAndUpdate(
            //     { username: to },
            //     {
            //         $inc: { "wallet.balance.crypto": amount },
            //         $push: {
            //             "transactions.crypto": {
            //                 id: parseFloat(performance.now().toString().replace(".", "")),
            //                 name: "Receive",
            //                 date: moment().format("MM/DD/YYYY hh:mm a"),
            //                 type: "Incoming",
            //                 amount: amount,
            //             },
            //         },
            //     }
            // );
        } else {
            return res.status(400).json({ message: "Invalid currency" });
        }
        return res.status(200).json({ message: "Send successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
//Convert cash to crypto
router.post("/convert", async (req, res) => {
    try {
        if (!req.session.loggedIn) return res.status(400).json({ message: "Unauthorized access" });
        let { amountFrom, amountTo, convertFrom, convertTo } = req.body;
        amountFrom = parseFloat(amountFrom);
        amountTo = parseFloat(amountTo);
        if (convertFrom === convertTo) return res.status(400).json({ message: "Invalid conversion" });
        var doc = await User.find({ username: req.session.user.username }).exec();
        if (convertFrom === "cash") {
            if (doc[0].wallet.balance.cash < amountFrom) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.cash": -amountFrom, "wallet.balance.crypto": amountTo },
                    $push: {
                        "transactions.cash": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Convert",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amountFrom,
                        },
                        "transactions.crypto": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Convert",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Incoming",
                            amount: amountTo,
                        },
                    },
                }
            );
        } else if (convertFrom === "crypto") {
            if (doc[0].wallet.balance.crypto < amountFrom) return res.status(400).json({ message: "Insufficient funds" });
            await User.findOneAndUpdate(
                { username: req.session.user.username },
                {
                    $inc: { "wallet.balance.crypto": -amountFrom, "wallet.balance.cash": amountTo },
                    $push: {
                        "transactions.crypto": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Convert",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Outgoing",
                            amount: amountFrom,
                        },
                        "transactions.cash": {
                            id: parseFloat(performance.now().toString().replace(".", "")),
                            name: "Convert",
                            date: moment().format("MM/DD/YYYY hh:mm a"),
                            type: "Incoming",
                            amount: amountTo,
                        },
                    },
                }
            );
        } else {
            return res.status(400).json({ message: "Invalid currency" });
        }
        return res.status(200).json({ message: "Convert successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// HTTPS wrapper for api call
router.get("/rates", async (req, res) => {
    try {
        let prices = await fetch("http://api.exchangeratesapi.io/v1/latest?access_key=6c96fb0c3d6fdca88c7478847c9b1796");
        let data = await prices.json();
        res.status(200).json({ data });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
