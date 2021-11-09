require('dotenv').config() //loads env variables

const express = require('express')
const app = express() 
const mongoose = require('mongoose')

mongoose.connect(process.env.DATABASE_URL, { usenewUrlParser: true})
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

app.use(express.json())

const usersRouter = require('./routes/users')
app.use('/users', usersRouter)



app.listen(3000, () => console.log("Server started"))

