if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const express = require("express");
const database = require("./components/database");

const app = express();
app.use(express.json());

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
