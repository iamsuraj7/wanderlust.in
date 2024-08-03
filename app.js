if(process.env.NODE_ENV != "production")
{
    require('dotenv').config();
}


const express=require("express");
const app=express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");


const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


// const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

 const dbUrl=process.env.ATLASDB_URL;

main()
.then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store=MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", () => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

const sessionOptions={
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
          expires: Date.now()+7*24*60*60*1000,
          maxAge:7*24*60*60*1000,
          httpOnly:true,
    },
};


// app.get("/", (req, res)=>{
//     res.send("hi i'm root");
// });




app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});


// app.get("/demouser", async (req, res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delte-student",
//     });

//     let registeredUser=await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


// app.get("/testListing", async (req, res)=>{
//     let sampleListing=new Listing({
//        title: "My New Villa",
//        description:"By the beach",
//        image:"https://plus.unsplash.com/premium_photo-1664304458186-9a67c1330d02?q=80&w=1890&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//        price:20000,
//        location:"Anjuna Beach, Goa",
//        country:"india",
//     });

    // await sampleListing.save();
    //   console.log("sample was saved");
    //   res.send("successful testing");
    // });

  app.all("*", (req, res, next)=>{
      next(new ExpressError(404, "page not found!"));
  });

 app.use((err, req, res, next) =>{
    let{status=500, message="something went wrong!"}=err;
    res.status(status).render("error.ejs", {message});
   // res.status(status).send(message);
 });   

app.listen(8080, ()=>{
    console.log("server is listening to port 8080");
});