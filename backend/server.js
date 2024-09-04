const express = require('express')
const app = express()
const fs = require('fs')
// Load SSL certificate and key
const options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.cert')
};

const server = require('http').createServer({}, app)
const io = require('socket.io')(server, {
  cors: {
      origin: '*',
      methods: ['GET', 'POST']
  }
})

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/https', (req, res) => {
  res.send('Hello, HTTPS!');
});

io.on('connection', socket => {
  console.log('New User connected :>> ', socket.id);
  socket.on('join-room', (roomId, userId) => {
    console.log('Joining :>> ', roomId, userId);
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)

    socket.on('leave-room', (roomId) => {
      console.log('leaving :>> ', roomId, userId);
      socket.leave(roomId)
      socket.to(roomId).emit('leave-room', userId)
    })

    socket.on('disconnect', () => {
      console.log('userId disconnected:>> ', userId);
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(5001,()=>{
  console.log("Server listening on 5001")
})