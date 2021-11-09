if (process.env.NODE_ENV !== "production") require("dotenv").config({ path: "./development.env" });
const express = require("express");
const database = require("./components/database");

const app = express();
app.use(express.json());

const usersRouter = require("./routes/users");
app.use("/users", usersRouter);

app.listen(3000, () => console.log("Server started"));
