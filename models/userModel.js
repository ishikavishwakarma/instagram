const mongoose = require("mongoose");
var plm = require("passport-local-mongoose");


var userSchema = mongoose.Schema({
  username: String,
  password: String,
name:String,
bio:String,
  email: String,
  stories: [{ type: mongoose.Schema.Types.ObjectId, ref: "story" }],
  image: {
    type: String,
    default: "userimg.jpeg",
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  key: String,
  expirykey: Date,
});
userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
