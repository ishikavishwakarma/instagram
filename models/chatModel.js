const mongoose = require('mongoose')

const chatSchema = mongoose.Schema({
   sender_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user'
   },
   receiver_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user'
   },
   is_online: {
    type: String,
    default: "0",
  },
   message:{
    type:String,
    required:true
   }
}
,{
  timestamps:true
 })



const chatModel = mongoose.model('chat',chatSchema) ;

module.exports = chatModel