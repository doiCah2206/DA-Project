import { Pool } from 'pg'
import dotenv from 'dotenv'

// Đọc file .env
dotenv.config()

// Tạo connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
})

const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                file_type VARCHAR(100),
                file_hash VARCHAR(64) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                document_type VARCHAR(50),
                description TEXT,
                owner_name VARCHAR(255),
                owner_address VARCHAR(255),
                tags TEXT[],
                transaction_hash VARCHAR(255),
                ipfs_uri VARCHAR(500),
                mint_date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                token_id VARCHAR(255)
            );
        `)

        console.log('Kết nối database thành công và đã kiểm tra bảng users/documents!')
    } catch (error: any) {
        console.error('Lỗi khởi tạo database:', error.message)
    }
}

void initializeDatabase()

export default pool