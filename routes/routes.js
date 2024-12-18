const express = require("express");
const router = express.Router();
const User = require("../model/users");
const multer = require("multer");
const fs = require("fs");

//image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

//Insert an user into database route (post)
router.post("/add", upload, (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    image: req.file.filename,
  });
  user.save();
  res.redirect("/");
});

//get all users route;
router.get("/", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.render("index", { title: "Home page", users: users });
  } catch (err) {
    console.error(err);
    // Optionally render an error view or send an error message
    res
      .status(500)
      .render("error", { message: "An error occurred while fetching users." });
  }
});

router.get("/", (req, res) => {
  res.render("index", { title: "Home page" });
});

router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add User" });
});

//edit and user
router.get('/edit/:id', async (req, res) => {
     try {
         let id = req.params.id;
         let user = await User.findById(id); // Use async/await to fetch the user
         if (!user) {
             return res.redirect('/');
         }
         res.render('edit_users', { title: 'Edit User', user: user });
     } catch (err) {
         console.error(err);
         res.redirect('/');
     }
 });

 //update user route
 router.post('/update/:id', upload, async (req, res) => {
     let id = req.params.id;
     let new_image = "";
 
     if (req.file) {
         new_image = req.file.filename;
         try {
             fs.unlinkSync('./uploads/' + req.body.old_image);
         } catch (err) {
             console.error("Failed to delete old image:", err);
         }
     } else {
         new_image = req.body.old_image;
     }
 
     try {
         await User.findByIdAndUpdate(id, {
             name: req.body.name,
             email: req.body.email,
             phone: req.body.phone,
             image: new_image,
         });
 
         res.redirect("/");
     } catch (err) {
         console.error(err);
         res.status(500).json({ message: "Error updating user" });
     }
 });


//delete user route
router.get('/delete/:id', async (req, res) => {
     try {
         const id = req.params.id;
 
         // Find and delete the user
         const user = await User.findByIdAndDelete(id);
 
         // If the user has an associated image, delete it from the filesystem
         if (user && user.image) {
             try {
                 fs.unlinkSync('./uploads/' + user.image);
             } catch (err) {
                 console.error("Failed to delete image file:", err);
             }
         }
 
         // Redirect after successful deletion
         res.redirect('/');
     } catch (err) {
         console.error(err);
         res.status(500).json({ message: "Error deleting user" });
     }
 });
 
module.exports = router;
