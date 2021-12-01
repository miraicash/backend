if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const { performance } = require("perf_hooks");
var Payment = require("../components/payment");
var User = require("../models/user");
const express = require("express");
const router = express.Router();
const moment = require("moment");

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

module.exports = router;
