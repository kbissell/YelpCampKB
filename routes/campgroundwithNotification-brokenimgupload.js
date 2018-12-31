var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var Review = require("../models/review");
var User = require("../models/user");
var Notification = require("../models/notification");

// google geocoder/maps api=============================
var NodeGeocoder = require('node-geocoder');
 
var options = {
      provider: 'google',
      httpAdapter: 'https',
      apiKey: process.env.GEOCODER_API_KEY,
      formatter: null
    };
 
var geocoder = NodeGeocoder(options);
//google geocoder end================================================

//image uploader setup

var request= require("request"); //what is this for?

var multer = require('multer');
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
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dyptwagko', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



// INDEX - show all campgrounds
router.get("/", function(req, res){  //NO CLOSING TAG======================================================
    // check the search regex function afterward
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        // search through campgrounds and return matches
            Campground.find({name: regex}).skip((perPage * pageNumber) -perPage).limit(perPage).exec(function (err, allCampgrounds) {
                Campground.count({name: regex}).exec(function (err, count) {
                    if(err){
                         console.log(err);
                         res.redirect("back");
                     } else {
                         if(allCampgrounds.length < 1){
                              noMatch = "No Campgrounds match that query, please try again";
                         }
                         res.render("campgrounds/index", {
                             campgrounds: allCampgrounds, 
                             current: pageNumber,
                             pages: Math.ceil(count/perPage), 
                             noMatch: noMatch,
                             search: req.query.search
                         });
                     }
            });
        });
        
    } else {
        
    // get all campgrounds from db
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count){
                if(err){
                     console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds, 
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
 }); //ENDS INDEX


//  CREATE - ADD NEW CAMPGROUND TO DB
router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res) {
    //   // get data from form and add to campgrounds array
    var name = req.body.name;
    // var image = req.body.image;
    // var imageId = req.body.imageId;
    var cost = req.body.price;
    var desc = req.body.description;
//   ===============================================================

    //add cloudinary stuff =================
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url for the image to the campground object under image property
      var image = result.secure_url;
        // add image's public_id to campground object
      var imageId = result.public_id;
      // add author to campground
    })
      var author = {
        id: req.user._id,
        username: req.user.username
      }
     var newCampground = {name: name, cost: cost, image:image, description: desc, author: author}

    try {
      let campground = await Campground.create(newCampground);
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
      }

      //redirect back to campgrounds page
      res.redirect(`/campgrounds/${campground.id}`);
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
});
//   create a new campground and save to db mine below - if commented back in add semi colon above
//     Campground.create(newCampground, function(err, campground){
//         if(err){
//             req.flash('error', err.message);
//             console.log(err);
//         }

//             res.redirect("/campgrounds");
//     });
//  });



// }); uncomment my campground new


//  geocoder.geocode(req.body.location, function (err, data) {
//     if (err || !data.length) {
//       req.flash('error', 'Invalid address');
//       return res.redirect('back');
//     }
//     var lat = data[0].latitude;
//     var lng = data[0].longitude;
//     var location = data[0].formattedAddress;

// var newCampground = {name: name, cost: cost, image:image, description: desc, author: author, location:location, lat: lat, lng: lng};
// if geocder is uncommented, the newCampground object above should replace what's below
   
//   var newCampground = {name: name, cost: cost, image:image, description: desc, author: author};
   
// }); uncomment if geocder is uncommented


// show form to create new campground
router.get("/new", middleware.isLoggedIn,  function(req, res){
    res.render("campgrounds/new");
});

// SHOW - ShoWs more info about one campground
// router.get("/:id", function(req,res){
//     //find the campground with the provided id
//     Campground.findById(req.params.id).populate("comments").populate({
//         //find the campground with the provided ID
//         path: "reviews",
//         options: {sort: {createdAt: -1}}
//     }).exec(function(err, foundCampground){
//         if(err){
//             console.log(err);
//         }else{
//             //render show template with that campground id
//             res.render("campgrounds/show", {campground: foundCampground});
//         }
//     });
// });

// new show route start

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});
//new show route end


// edit campground route
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});  
    });
});

// update campground route
router.put("/:id/", middleware.checkCampgroundOwnership, function(req, res){
      geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    
    //   find and update the correct page
    delete req.body.campground.rating;
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            // redirect to somewhere
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
  });
});

// destroy campground route
router.delete("/:id", middleware.checkCampgroundOwnership,function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            //deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                //deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }// delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;