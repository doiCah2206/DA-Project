import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './config/db'
import authRoutes from './routes/auth'
import documentRoutes from './routes/documents'
import { startContractListener } from './listeners/contractListener'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Server đang chạy!' })
})

app.listen(PORT, () => {
    console.log(`Server chạy ở http://localhost:${PORT}`)
    void startContractListener()
})

