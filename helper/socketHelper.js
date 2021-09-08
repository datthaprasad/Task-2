const Filter = require('bad-words');
const Message = require('../models/message')

const onlineUsers = [];

const socketHelper = async (io) => {
    io.use(async function (socket, next) {
        try {

            var handshakeData = socket.request;
            userId = handshakeData._query['userId'];
            onlineUsers.push({ userId, socketId: socket.id });
            next();
        }
        catch (e) {
            console.log("socket connection error : " + e);
        }
    });



    io.on('connection', (socket) => {
        console.log('New WebSocket connection' + socket.id);
        io.to(socket.id).emit('welcome', 'this is urs id' + socket.id);


        socket.on('sendMessage', async (messageData, callback) => {
            const filter = new Filter()

            if (filter.isProfane(messageData.message)) {
                return callback('Profanity/Bad words is not allowed!')
            }
            try {
                await new Message(messageData).save();
            }
            catch (e) {
                return callback("Saving message to databse failure " + e)
            }
            const toUser = onlineUsers.filter((user) => user.userId === messageData.to)

            if (toUser && toUser.length > 0)
                io.to(toUser[0].socketId).emit('message', messageData);
            callback()
        })


        socket.on('disconnect', () => {
            const index = onlineUsers.findIndex((user) => user.socketId === socket.id)

            if (index !== -1) {
                onlineUsers.splice(index, 1)[0]
            }
            console.log("user refreshed");
        })

        socket.on('isOnline', async (id, callback) => {
            try {
                isOnline = onlineUsers.filter((user) => user.userId === id);
                if (isOnline && isOnline.length > 0)
                    callback()
                else
                    callback("offline");
            }
            catch (error) {
                callback(error);
            }
        })
    })
}

module.exports = socketHelper;