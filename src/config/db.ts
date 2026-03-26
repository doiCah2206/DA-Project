import { Pool } from 'pg'
import dotenv from 'dotenv'

// Đọc file .env
dotenv.config()

// Tạo connection pool
const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
})

// Kiểm tra kết nối khi khởi động
pool.connect((err, client, release) => {
    if (err) {
        console.error('Lỗi kết nối database:', err.message)
    } else {
        console.log('Kết nối database thành công!')
        release()
    }
})

export default pool