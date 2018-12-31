var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require('multer');
var request = require("request");
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
     }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dyptwagko', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



//INDEX - show all campgrounds
router.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            Campground.find({name: regex}, function(err, allCampgrounds){
        if(err){
             console.log(err);
         } else {
             if(allCampgrounds.length < 1){
                  noMatch = "No Campgrounds match that query, please try again";
             }
             res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch});
         }
    });
        
    } else {
    Campground.find({}, function(err, allCampgrounds){
        if(err){
             console.log(err);
         } else {
             res.render("campgrounds/index", {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch});
         }
    });
    }

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
      req.body.campground.image = result.secure_url;
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
    Campground.create(req.body.campground, function(err, campground){
        if(err){
            req.flash('error', err.message);
            console.log(err);
        }
            res.redirect("/campgrounds");
    });
 });


router.get("/new", middleware.isLoggedIn,  function(req, res){
    res.render("campgrounds/new");
});



router.get("/:id", function(req,res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }else{
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

router.get("/:id/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});  
    });
});

router.put("/:id/", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
        if(err){
            req.flash("error", err.message)
            res.redirect("back");
        } else {
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});

router.delete("/:id", middleware.checkCampgroundOwnership,function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
    if(err){
        res.redirect("/campgrounds");
    } else {
        req.flash("success", "Campground deleted");
        res.redirect("/campgrounds");
    }
});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;