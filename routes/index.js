var express = require("express");
var router = express.Router();
const userModel = require("../models/userModel");
const postModel = require("../models/postModel")
const storyModel = require("../models/storyModel")
const chatModel = require("../models/chatModel")
var passport = require("passport");
const path = require("path");
require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");
const mongoose = require("mongoose");
const localStrategy = require("passport-local");
const { render } = require("ejs");
const upload = require("./multer");
passport.use(new localStrategy(userModel.authenticate()));

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

router.get("/", function (req, res, next) {
  res.render("index", { footer: false });
});
router.post('/post', isLoggedIn, upload.single("imageOrVideo"),function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      storyModel.create({
        userid: founduser._id,
        storyimage: req.file ? req.file.filename:null,
        data:req.body.storydata
      })
        .then(function (createdpost) {
          console.log(createdpost)
          founduser.stories.push(createdpost._id)
          console.log(createdpost._id)
          founduser.save()
          .then(function () {
              console.log(founduser)
              console.log("uploaded")
              res.redirect("/feed")
            })
        })
    });
});

router.post(
  "/update",
  isLoggedIn,
  upload.single("image"),
  async function (req, res, next) {
    try {
      const user = await userModel.findOneAndUpdate(
        { username: req.session.passport.user },
        {
          username: req.body.username,
          name: req.body.name,
          bio: req.body.bio,
        },
        { new: true }
      );

      if (req.file) {
        user.image = req.file.filename;
        await user.save();
      }
      res.redirect("/profile");
    } catch (err) {
      // Handle errors here
      console.log(error);
      res.status(500).send("An error occurred while updating the profile.");
    }
  }
);
router.get('/like/:postid', isLoggedIn, function (req, res, next) {
  userModel.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      postModel
        .findOne({ _id: req.params.postid })
        .then(function (post) {
          if (post.likes.indexOf(founduser._id) === -1) {
            post.likes.push(founduser._id);
            // console.log( post.likes.push(founduser._id))
          }
          else{
            post.likes.splice(post.likes.indexOf(founduser._id), 1)
          }
          post.save()
            .then(function () {
              res.redirect("back")
            })
        })
    })
});
router.post("/upload", isLoggedIn,upload.single("image"),async function (req, res, next) {
  try {
    const founduser =  await userModel.findOne({ username: req.session.passport.user });
    const { image, caption, latitude, longitude } = req.body;
  const post =  await  postModel.create({
      image:image,
      user: founduser._id,
      caption: caption,
      location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    })
    founduser.posts.push(post._id);
    await founduser.save();
    res.redirect("/feed");
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while uploading a post.");
  }

});
router.post("/register", function (req, res, next) {
  userModel
    .findOne({ username: req.params.username })
    .then(function (userDetails) {
      if (userDetails) res.send("username are exist");
      else {
        var userDetails = new userModel({
          username: req.body.username,
          name: req.body.name,
          email: req.body.email,
        });

        userModel.register(userDetails, req.body.password).then(function (u) {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/profile");
          });
        });
      }
    });
});
router.get("/login", function (req, res, next) {
  res.render("login", { footer: false });
});
router.get("/story", function (req, res, next) {
  res.render("story", { footer: false });
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  }),
  function (req, res, next) {}
);
router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/login");
  });
});

router.get("/feed",isLoggedIn, async function (req, res, next) {
  const user= await  userModel.findOne({ username: req.session.passport.user });
 const posts = await postModel.find() .populate("user")
 const allstories = await storyModel.find({date:{$gt:new Date(Date.now()-24*60*60*1000), }}).populate("userid")
  res.render("feed", { footer: true,posts,user,allstories });
});
router.get("/stories/:id", isLoggedIn, function (req, res, next) {
  userModel
    .findOne({ _id: req.params.id })
    .populate({
      path: "stories",
      match: { date: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })
    .then(function (user) {
      if (!user) {
        return res.status(404).send("User not found");
      }
      const onlyuser = req.user;
      console.log(onlyuser)
      const userstory = user.stories;
      // userstory.views.push(onlyuser_id)
      // userstory.save()
      // console.log(userstory[0])
      if (!userstory || userstory.length === 0) {
        return res.status(404).send("User has no recent stories");
      }

      res.render("stories", {footer: false, userstory, user });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});
router.get("/profile/:id", isLoggedIn,async function (req, res, next) {
  const founduser = await userModel.findOne({ _id: req.params.id }).populate("posts")
   

      res.render("users", {footer: true, founduser });
});
router.get("/profile", isLoggedIn, async function (req, res, next) {
  const founduser = await userModel
    .findOne({ username: req.session.passport.user }).populate("posts")
   
      // console.log(founduser);
      res.render("profile", { founduser, footer: true });
  
});

router.get("/search",isLoggedIn, function (req, res, next) {
  res.render("search", { footer: true });
});
router.get("/chat",isLoggedIn, async function (req, res, next) {
  const user= await  userModel.findOne({ username: req.session.passport.user });
  const allusers = await   userModel
  .find({ username: { $nin:[req.session.passport.user]} })
  res.render("chat", { footer: true,user,allusers });
});
router.get("/chat/:username", isLoggedIn, function (req, res) {
  const loggedInUser = req.session.passport.user;
  const requestedUsername = req.params.username;

  userModel.findOne({ username: requestedUsername }).then(function (founduser) {
    if (!founduser) {
      // Handle case where the requested user isn't found
      return res.status(404).send("User not found");
    }

    userModel.find({ 
      username: { 
        $nin: [loggedInUser, requestedUsername]
      } 
    }).then(function (foundusers) {
      // console.log(foundusers);
      res.render("chatting", {footer: false, founduser, foundusers, onlyuser: req.user });
    }).catch(function (error) {
      // Handle the error
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
  }).catch(function (error) {
    // Handle the error
    console.error(error);
    res.status(500).send("Internal Server Error");
  });
});
router.post('/save-chat',async (req,res)=>{
  try{
   var Chat =  new chatModel({
      sender_id:req.body.sender_id,
      receiver_id:req.body.receiver_id,
      message:req.body.message,
    })
    console.log(Chat)
    var newChat = await Chat.save();
   res.status(200).send({success:true,msg:'chat inserted',data:newChat})
  
  }catch(err){
   console.log(err)
  }
  })
router.get("/username/:username",isLoggedIn, async function (req, res, next) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const users = await userModel
  .find({ username: regex });
  res.json(users)
});

router.get("/edit",isLoggedIn, async function (req, res, next) {
  const founduser =  await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { footer: true , founduser});
});

router.get("/upload",isLoggedIn, function (req, res, next) {
  res.render("upload", { footer: true });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
