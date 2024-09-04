const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server, {
  cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
      allowEIO3: true,
  },
  transport: ['websocket'],
})
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

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