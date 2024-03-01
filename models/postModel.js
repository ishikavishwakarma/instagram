const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    picture:String,
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    caption:String,
    likes:[ 
        {
            type:mongoose.Schema.Types.ObjectId,
        ref:"user" 
        }
    ],
    date:{
        type:Date,
        default:Date.now()
    }
})
module.exports = mongoose.model("post",postSchema);