const mongoose = require("mongoose");

const storySchema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    views:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    data:String,
   storyimage:{
        type:String,
      },
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
const storyModel = mongoose.model("story", storySchema);

module.exports = storyModel;