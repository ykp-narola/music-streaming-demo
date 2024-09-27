const express = require('express')
const app = express()
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const fs = require('fs');
require("dotenv").config()
const server = require('http').createServer({}, app)

// Load SSL certificate and key
const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

const io = require('socket.io')(server, {
  cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
      allowEIO3: true,
  },
  transport: ['websocket'],
})
// Connect to the database
connectDB();
app.set('view engine', 'ejs')
// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(require("morgan")(':remote-addr - :remote-user - [:date[clf]] - ":method :url HTTP/:http-version" - :status - :res[content-length] B -  :response-time ms'))

// Static file serving
app.use('/uploads', express.static('uploads'));
app.use('/uploads/music', express.static(path.join(__dirname, 'uploads/music'))); // Serve music files
app.use('/uploads/image', express.static(path.join(__dirname, 'uploads/image'))); // Serve music files
app.use(express.static('public'))
app.get('/health-check', (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Health Check Successful",
    data: {
        date: new Date(),
        CPUs: require('os').cpus().length
    }
});
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/music', require('./routes/musicRoutes'));
app.use('/api/meeting', require('./routes/meetingRoutes'));

require("./socket")(io)

server.listen(5001,()=>{
  console.log("Server listening on 5001")
})