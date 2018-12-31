// YELPCAMP
require('dotenv').config()

var express        = require("express"),
    app            = express(),
    passport       = require("passport"),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    LocalStrategy  = require("passport-local"),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
    User           = require("./models/user"),
    Campground     = require("./models/campground"),
    User             = require("./models/user"),
    Comment        = require("./models/comment");
    // seedDB         = require("./seeds")
// seedDB(); // seed the database

// requiring routes
var commentRoutes = require("./routes/comments"),
    reviewRoutes = require("./routes/reviews"),
    campgroundRoutes= require("./routes/campground"),
    indexRoutes = require("./routes/index")

mongoose.connect("mongodb://localhost/yelp_camp");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require("moment");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret:" I am the very model of a modern major general",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//my app.use functino below. adding notifications
// app.use(function(req, res, next){
//     res.locals.currentUser = req.user;
//     res.locals.error = req.flash("error");
//     res.locals.success = req.flash("success");
//     next();
// });

// app.use for notifications
app.use(async function(req, res, next){
   res.locals.currentUser = req.user;
   if(req.user) {
    try {
      let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
      res.locals.notifications = user.notifications.reverse();
    } catch(err) {
      console.log(err.message);
    }
   }
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});
//end app.use for notifications

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Yelp camp app has started!!");
});