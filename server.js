const express = require('express')
const app = express()
const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')
const connectDB = require('./db/connectDB')
const session = require('express-session')
const nocache = require('nocache')
const passport = require('passport')
require("./utils/googleVerification");
require("./utils/githubVerification.js")
require("./utils/microsoftVarification.js")
require("./utils/facebookVerification.js")


const PORT = 3000
 
//parse inputs
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//view engine
app.set("view engine",'ejs')

//session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))

app.use(nocache());

app.use(passport.initialize())
app.use(passport.session())  


//public files
app.use(express.static('public'))

//routes
app.use('/',userRoute)
app.use('/admin',adminRoute)

//database connection
connectDB()

//listen
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})
