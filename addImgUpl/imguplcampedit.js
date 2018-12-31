// views/campground/edit.ejs
// <% include ../partials/header %>
//     <div class="row">
//         <h1 style="text-align: center">Edit <%= campground.name %></h1>
//         <div style="width: 30%; margin: 25px auto;">
//             <form action="/campgrounds/<%=campground._id%>?_method=PUT" method="POST" enctype="multipart/form-data">
//                 <div class="form-group">
//                     <input class="form-control" type="text" name="name" value="<%= campground.name %>">
//                 </div>
//                 <div class="form-group">
//                     <label for="image">Image</label>
//                     <input type="file" id="image" name="image" accept="image/*">
//                 </div>
//                 <div class="form-group">
//                     <input class="form-control" type="text" name="description" value="<%= campground.description %>">
//                 </div>
//                 <div class="form-group">
//                     <button class="btn btn-lg btn-primary btn-block">Update!</button>
//                 </div>
//             </form>
//             <a href="/campgrounds">Go Back</a>
//         </div>
//     </div>
// <% include ../partials/footer %>
