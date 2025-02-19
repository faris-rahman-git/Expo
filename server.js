const express = require("express");
const app = express();
const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const connectDB = require("./db/connectDB");
const session = require("express-session");
const nocache = require("nocache");
const passport = require("passport");
const methodOverride = require("method-override");
const { errHandler, notFoundHandler } = require("./middlewares/auth.js");
const MongoDBStore = require("connect-mongodb-session")(session);

require("./utils/googleVerification.js");
require("./utils/githubVerification.js");
require("./utils/microsoftVarification.js");
require("./utils/facebookVerification.js");

// Set up method-override middleware
app.use(methodOverride("_method"));

//parse inputs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//view engine
app.set("view engine", "ejs");

//database connection
connectDB();

//session handle
const store = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: "sessionmodels",
});
//session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    rolling: false,
    store: store,
  })
);

app.use(nocache());

app.use(passport.initialize());
app.use(passport.session());

//public files
app.use(express.static("Public"));

//routes
app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use(errHandler);

app.use(notFoundHandler);

//listen
app.listen(process.env.PORT || 3000, () => {
  console.log(`server is running on port ${process.env.PORT || 3000}`);
});
