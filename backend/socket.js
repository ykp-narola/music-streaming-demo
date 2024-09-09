module.exports = io => {
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
            
                socket.on('mute-status-change', (peerId, isMuted) => {
                    console.log('mute :>> ',roomId, peerId, isMuted);
                    socket.to(roomId).emit('mute-status', {peerId, isMuted })
                })
                socket.on('disconnect', () => {
                    console.log('join-room >> userId disconnected:>> ', userId);
                    socket.to(roomId).emit('user-disconnected', userId)
                })
            })  
            socket.on('disconnect', () => {
                console.log('userId disconnected:>> ', socket.id);
            })
    })
}