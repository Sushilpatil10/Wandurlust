if(process.env.NODE_ENV != "production")
{
    require('dotenv').config();
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session  =require("express-session");
const MongoStore =require('connect-mongo');
const flash =require("connect-flash");
const passport =require("passport");
const LocalStrategy=require("passport-local");
const User =require("./models/user.js");


const listingRouter =require("./routes/listing.js");
const reviewRouter =require("./routes/review.js");
const userRouter =require("./routes/user.js")

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3030;

// const mongodb_url ="mongodb://127.0.0.1:27017/wanderlust"
const dburl =process.env.ATLASDB_URL ;

async function main() {
    await mongoose.connect(dburl);
}

main()
    .then(() => {
        console.log("Connected to DB WanderLust");
    })
    .catch((err) => {
        console.log(err);
    });


  const store =MongoStore.create({
    mongoUrl:dburl,
    crypto :{
        secret :process.env.SECRET,
    },
    touchAfter:24*3600,

  });

  store.on("error",(err)=>{
    console.log("Error in Mongo Session Store" ,err);
  });

   const sessionOptions = {
  store: store, 
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};



  

  app.use(session(sessionOptions));
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());


  app.use((req,res,next)=>{
    res.locals.success =req.flash("success");
    res.locals.error =req.flash("error");
    res.locals.currUser =req.user;
    // console.log(res.locals.success)
    next();
  })




app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


// app.all("*",(req,res,next)=>{

//     next(new ExpressError(404,"Page Not Found"));

// });

app.get("/", (req, res) => {
  res.redirect("/listings"); 
});



// General Error Handling Middleware: This MUST be the very last app.use()
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{err});
});

app.listen(PORT, (req, res) => {
    console.log(`Server is listening on Port ${PORT}`);
});
