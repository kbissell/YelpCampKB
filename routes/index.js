var express  = require("express"),
    passport = require("passport");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var Notification = require("../models/notification");
var { isLoggedIn } = require('../middleware');



router.get("/", function(req, res){
    res.render("landing");
});

// SHOW REGISTER FORM
router.get("/register", function(req, res){
    res.render("register", {page: 'register'});
});

// Handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User(
        {
            username: req.body.username,
            avatar: req.body.avatar,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });
    // eval(require('locus'));
    if(req.body.adminCode === 'kevinisadmin'){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            return res.render("register", {"error":err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});
//https://ide.c9.io/learnwithcolt/webdevbootcamp
// get+render login form
router.get("/login", function(req, res){
    res.render("login",{page: 'login'});
});

// login logic - middleware
router.post("/login", passport.authenticate("local",
        {
            successRedirect: "/campgrounds", 
            failureRedirect: "/login",
            failureFlash: true,
            successFlash: 'Welcome to YelpCamp '
        }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "logged you out!");
   res.redirect("/campgrounds");
});

//render forgot password page
router.get("/forgot", function(req, res){
    res.render("forgot");
});

//create an email to send "forgot password" email

router.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        // check to see if user is already registered
        function(token, done) {
            User.findOne({email: req.body.email }, function(err, user) {
                if(!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }
                
                user.resetPasswordToken=token; //changes pasword token 
                user.resetPasswordExpires = Date.now() + 36000000; //token lasts 1 hour
                
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        //actually send the email
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'kevin.t.bissell@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'kevin.t.bissell@gmail.com',
                subject: 'Node.js Password Reset testing', 
                text: 'You are receiving this because you (or someone else) have requested the rest of the password for your account. \n\n'+
                      'Please click on the following link, or paste this into your browser to complete the process:\n\n'+
                      'http://'+req.headers.host + '/reset' + token + '\n\n' +
                      'If you did not requests this, please ignore this email and your password will remain unchanged. \n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An email has been sent to '+user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

//render the 'reset' view
 router.get('/reset/:token', function(req, res) {
     //find if user exists and/or token has expired
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

// send the reset token
router.post('/reset/:token', function(req, res) {
  async.waterfall([ //runs several functions in a row
    function(done) {
        //if we find updated password,  otherwise, display error
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        //verify passwords match as they retype it
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
              //set the 'reset' options back to undefined
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            //save the user information again and log them in
            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'kevin.t.bissell@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'kevin.t.bissell@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

 
 
 
// USER PROFILES below is my old, adding new profile with notifications
// router.get("/users/:id", function(req, res) {
//     User.findById(req.params.id, function(err, foundUser) {
//         if(err) {
//             req.flash("error", "something went wrong.");
//             res.redirect("back");
//         }
//         Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
//             if(err) {
//                 req.flash("error", "Something went wrong.");
//                 res.redirect("/");
//             }
//         res.render("users/show", {user: foundUser, campgrounds: campgrounds});
//         });
//     });
// });


// user profile - with notifications
router.get('/users/:id', async function(req, res) {
  try {
    let user = await User.findById(req.params.id).populate('followers').exec();
    res.render('profile', { user });
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// follow user
router.get('/follow/:id', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'Successfully followed ' + user.username + '!');
    res.redirect('/users/' + req.params.id);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// view all notifications
router.get('/notifications', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notifications/index', { allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id', isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/campgrounds/${notification.campgroundId}`);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});
// end notifications part

module.exports = router;