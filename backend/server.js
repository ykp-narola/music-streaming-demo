const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const app = express();
const http = require('http');
const { Server } = require("socket.io")
// Connect to the database
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(require("morgan")(':remote-addr - :remote-user - [:date[clf]] - ":method :url HTTP/:http-version" - :status - :res[content-length] B -  :response-time ms'))

// Static file serving
app.use('/uploads', express.static('uploads'));
app.use('/uploads/music', express.static(path.join(__dirname, 'uploads/music'))); // Serve music files
app.use('/uploads/image', express.static(path.join(__dirname, 'uploads/image'))); // Serve music files


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/songs', require('./routes/songRoutes'));
app.use('/api/music', require('./routes/musicRoutes'));

const server  = http.createServer(app);

const io = new Server(server,{
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
        allowEIO3: true,
    },
    transport: ['websocket'],
});

const rooms = [];

io.on('connection', (socket) => {
    console.log('New client connected');
  
    socket.on('create-room', () => {
      const roomId = socket.id; // Use socket ID as room ID
      rooms[roomId] = [socket.id]; // Create a new room with the creator
      socket.join(roomId);
      socket.emit('room-created', { roomId });
    });
  
    socket.on('join-room', (roomId) => {
      if (rooms[roomId]) {
        rooms[roomId].push(socket.id);
        socket.join(roomId);
        socket.to(roomId).emit('new-member', { userId: socket.id });
      } else {
        socket.emit('room-not-found');
      }
    });
  
    socket.on('signal', (data) => {
      socket.to(data.roomId).emit('signal', {
        signal: data.signal,
        userId: socket.id,
      });
    });
  
    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const index = rooms[roomId].indexOf(socket.id);
        if (index !== -1) {
          rooms[roomId].splice(index, 1);
          if (rooms[roomId].length === 0) {
            delete rooms[roomId]; // Remove empty rooms
          } else {
            socket.to(roomId).emit('member-left', { userId: socket.id });
          }
          break;
        }
      }
    });
  });

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
