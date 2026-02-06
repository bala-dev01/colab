import { io, Socket } from 'socket.io-client'
import { FloatingObject } from './store'

let socket: Socket | null = null

export const initSocket = async () => {
    // Call the api route to start the server if not already running
    await fetch('/api/socket')

    // Explicitly connect to the same host, but ensure path matches if we configured one
    // Since we attached to the Next.js server, standard path /socket.io/ usually works
    // provided the server upgrade happened correctly.
    socket = io({
        path: '/api/socket_io', // Configure custom path if needed, but for now try standard
        addTrailingSlash: false,
    })

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server with ID:', socket?.id)
    })

    socket.on('connect_error', (err) => {
        console.error('❌ WebSocket Connection Error:', err.message)
    })

    return socket
}

export const getSocket = () => socket

// Socket Actions
export const joinMeetRoom = (roomId: string) => {
    if (socket) {
        socket.emit('join-room', roomId)
    }
}

export const broadcastObjectCreate = (roomId: string, object: FloatingObject) => {
    if (socket) socket.emit('create-object', { roomId, object })
}

export const broadcastObjectUpdate = (roomId: string, objectId: string, changes: Partial<FloatingObject>) => {
    if (socket) socket.emit('update-object', { roomId, objectId, changes })
}

export const broadcastHandMove = (roomId: string, userId: string, position: { x: number, y: number }) => {
    if (socket) socket.emit('hand-move', { roomId, userId, position })
}
