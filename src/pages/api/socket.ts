import { Server } from 'socket.io'

export default function SocketHandler(req: any, res: any) {
    if (res.socket.server.io) {
        console.log('Socket is already running')
    } else {
        console.log('Socket is initializing')
        const io = new Server(res.socket.server, {
            path: '/api/socket_io',
            addTrailingSlash: false,
        })
        res.socket.server.io = io

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id)

            // Join a specific Meet session room
            socket.on('join-room', (roomId) => {
                socket.join(roomId)
                console.log(`Socket ${socket.id} joined room ${roomId}`)
            })

            // Sync Object Creation
            socket.on('create-object', ({ roomId, object }) => {
                console.log('Broadcasting object creation to room:', roomId)
                // Broadcast to everyone ELSE in the room
                socket.to(roomId).emit('object-created', object)
            })

            // Sync Object Movement
            socket.on('update-object', ({ roomId, objectId, changes }) => {
                socket.to(roomId).emit('object-updated', { objectId, changes })
            })

            // Sync Hand Presence (Optional, for showing other cursors)
            socket.on('hand-move', ({ roomId, userId, position }) => {
                socket.to(roomId).emit('peer-hand-moved', { userId, position })
            })

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id)
            })
        })
    }
    res.end()
}
