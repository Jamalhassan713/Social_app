
import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyToken } from '../utils'
import { chatInitiation } from '../modules/chat/chat'

export const connectedSocket = new Map<string, String[]>()
let io: Server | null = null


function socketAuthentication(socket: Socket, next: Function) {
    const token = socket.handshake.auth.authorization
    const decodedData = verifyToken(token as string, process.env.JWT_ACCESS_SECRET as string)
    socket.data = { userId: decodedData._id }

    const userTabs = connectedSocket.get(socket.data.userId)
    if (!userTabs) connectedSocket.set(socket.data.userId, [socket.id])
    else userTabs.push(socket.id)
    next()
}
function socketDisconnection(socket: Socket) {
    socket.on('disconnect', () => {
        const userId = socket.data.userId
        let userTabs = connectedSocket.get(userId)
        if (userTabs && userTabs.length) {
            userTabs = userTabs.filter((tab) => tab !== socket.id)
            if (!userTabs.length) connectedSocket.delete(userId)
        }
        socket.broadcast.emit('disconnect_user', { userId, socketId: socket.id })
    })
}

export const toInitialize = (server: HttpServer) => {
    io = new Server(server, { cors: { origin: '*' } })
    io.use(socketAuthentication)
    io.on('connection', (socket: Socket) => {
        chatInitiation(socket)
        socketDisconnection(socket)
    })
}

export const getIo = () => {
    try {
        if (!io) throw new Error('Socket.io not initialized')
        return io
    } catch (error) {
        console.log(error);
    }
}