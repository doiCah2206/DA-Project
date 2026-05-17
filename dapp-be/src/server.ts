import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import { randomUUID } from 'crypto'
import './config/db'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import { startContractListener } from './listeners/contractListener'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// Middleware
app.use(cors({
    origin: CLIENT_ORIGIN
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server đang chạy!' })
})

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST']
    }
})

type ChatMessage = {
    id: string
    listingId: string
    senderAddress: string
    senderName: string
    message: string
    timestamp: number
}

const chatRooms = new Map<string, ChatMessage[]>()
const MAX_MESSAGES = 200

const getRoomKey = (listingId: string) => `listing:${listingId}`

io.on('connection', (socket) => {
    socket.on('chat:join', (payload: { listingId?: string }) => {
        const listingId = payload?.listingId?.trim()
        if (!listingId) return
        const room = getRoomKey(listingId)
        socket.join(room)
        const history = chatRooms.get(room) ?? []
        socket.emit('chat:history', history)
    })

    socket.on('chat:message', (payload: {
        listingId?: string
        senderAddress?: string
        senderName?: string
        message?: string
    }) => {
        const listingId = payload?.listingId?.trim()
        const senderAddress = payload?.senderAddress?.trim()
        const senderName = payload?.senderName?.trim() || 'Anonymous'
        const message = payload?.message?.trim()

        if (!listingId || !senderAddress || !message) return
        const room = getRoomKey(listingId)
        const entry: ChatMessage = {
            id: randomUUID(),
            listingId,
            senderAddress,
            senderName,
            message,
            timestamp: Date.now()
        }

        const history = chatRooms.get(room) ?? []
        history.push(entry)
        if (history.length > MAX_MESSAGES) {
            history.splice(0, history.length - MAX_MESSAGES)
        }
        chatRooms.set(room, history)

        io.to(room).emit('chat:message', entry)
    })
})

server.listen(PORT, () => {
    console.log(`Server chạy ở http://localhost:${PORT}`)
    void startContractListener()
})

