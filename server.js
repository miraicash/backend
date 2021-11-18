if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
// const database = require("./components/database");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "localsecretkey",
        cookie: { maxAge: 1000 * 60 * 60 * 24 /** 24 hours */ },
        saveUninitialized: true,
        resave: false,
    })
);
app.use(cookieParser());

app.use(express.static(__dirname));

const usersRouter = require("./routes/users");
app.use("/users", usersRouter);

app.get("/", (req, res) => {
    try {
        res.json({ message: "API Route working." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${PORT}`);
});
