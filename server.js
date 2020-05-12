const path = require('path'); // 1
const http = require('http'); // 2
const express = require('express'); // 1
const socketio = require('socket.io'); // 3
const formatMessage = require('./public/utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./public/utils/users');

const app = express(); //1
const server = http.createServer(app)
const io = socketio(server) // 3


// Set static folder 1
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';
        
// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });
  
    // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
  });

const PORT = 3000 || process.env.PORT; // 1

server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); // 1