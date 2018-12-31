Routes

Name        url             verb        desc.
===============================================
INDEX    /campgrounds         GET       Display a list of all campgrounds
NEW      /campgrounds/new     GET       Display form to make new campground
CREATE   /campgrounds         POST      Add new campground to db
SHOW     /campgrounds/:id     GET       Shows info about one campground


NEW     /campgrounds/:id/comments/new  GET      Display form to make new comment
CREATE  /campgrounds/:id/comments      POST     Add new comment to particular campground
