import { Pool } from 'pg'
import dotenv from 'dotenv'

// Đọc file .env
dotenv.config()

const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key])
if (missingEnvVars.length > 0) {
    console.warn(`Thiếu biến môi trường DB: ${missingEnvVars.join(', ')}`)
}

const dbPort = Number(process.env.DB_PORT)
if (Number.isNaN(dbPort)) {
    console.warn('DB_PORT không hợp lệ, sẽ dùng mặc định 5432')
}

// Tạo connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number.isNaN(dbPort) ? 5432 : dbPort,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

pool.on('error', (error) => {
    console.error('Lỗi từ pool database:', error.message)
})

const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(255) UNIQUE NOT NULL,
                nonce VARCHAR(20),                          -- ← THÊM: challenge nonce
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                file_type VARCHAR(100),
                file_hash VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                document_type VARCHAR(50),
                description TEXT,
                owner_name VARCHAR(255),
                owner_address VARCHAR(255),
                tags TEXT[],
                transaction_hash VARCHAR(255),
                ipfs_uri VARCHAR(500),
                ipfs_cid VARCHAR(255),                     -- ← THÊM: CID từ Pinata
                encrypted_key TEXT,                        -- ← THÊM: AES key (nếu dùng encryption)
                mint_date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                token_id VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS access_log (        -- ← THÊM: bảng log verify
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
                file_hash VARCHAR(255),
                ip_address VARCHAR(45),
                user_agent TEXT,
                found BOOLEAN,
                viewer_address VARCHAR(255),   
                action VARCHAR(50),
                accessed_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
            CREATE INDEX IF NOT EXISTS idx_access_log_file_hash ON access_log(file_hash);
            CREATE INDEX IF NOT EXISTS idx_access_log_document_id ON access_log(document_id);
        `)

        console.log('Kết nối database thành công và đã kiểm tra bảng users/documents!')
    } catch (error: any) {
        console.error('Lỗi khởi tạo database:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
        })
    }
}

void initializeDatabase()

export default pool