var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// New comment
router.get("/new", middleware.isLoggedIn, function(req,res){
        Campground.findById(req.params.id, function(err, campground){
            if(err) {
                console.log(err);
            } else {
                res.render("comments/new", {campground: campground});
            }
        });
});
// Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
    // lookup campground by id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else {
                // create new comment
                Comment.create(req.body.comment, function(err, comment){
                    if(err){
                        req.flash("error", "something went wrong!")
                        console.log(err);
                    }else {
                        // add username and id to comment
                        comment.author.id = req.user._id;
                        comment.author.username = req.user.username;
                        // save comment
                        comment.save();
                        // connect new comment to campground
                        campground.comments.push(comment);
                        campground.save();
                        req.flash("success", "Successfully added comment");
                        res.redirect('/campgrounds/'+campground._id);
                    }
                });
                
                // redirect to campground show page
        }
        
    });

});
// comments edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        }else {
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
    });
});
// comments update route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    // findByIdAndUpdate takes 3 things. The id to "find by", the data to update it with, and the 
    // callback to run afterward
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});

// comments delete route

router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    // find by id and remove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
    if(err){
        res.redirect("back");
    } else {
        req.flash("success", "Comment deleted");
        res.redirect("/campgrounds/"+req.params.id);
    }
    });

});


// attempt to get edit authorization start

// attempt to get edit authorization finish
module.exports = router;