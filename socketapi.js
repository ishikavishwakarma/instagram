const users = require("./models/userModel");
const userModel = require("./models/userModel");
const chatModel = require("./models/chatModel");

const io = require( "socket.io" )();
const socketapi = {
    io: io
};
var usp = io.of('/name')

// Add your socket.io logic here!
usp.on( "connection",async  function( socket ) {
    console.log( "A user connected" );

     var userId = socket.handshake.auth.token
    await userModel.findByIdAndUpdate({ _id:userId},{$set:{is_online:"1"}})
    console.log(userId)
    //broadcast
    socket.broadcast.emit('getOnlineUser',{founduser_id : userId})

    //chatting
    socket.on('newChats',function(data){
        socket.broadcast.emit('loadChats',data)
    })
    //load chats
    socket.on('existsChat',async function(data){
        var chats = await chatModel.find({ $or:[
            { sender_id: data.sender_id, receiver_id: data.receiver_id },
            { sender_id: data.receiver_id, receiver_id: data.sender_id },
        ]});
        socket.emit('load', { chats: chats });

    })
});
// end of socket.io logic

module.exports = socketapi;