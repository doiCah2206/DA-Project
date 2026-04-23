import { Pool } from "pg";
import dotenv from "dotenv";

// Đọc file .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
  ] as const;
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length > 0) {
    console.warn(`Thiếu biến môi trường DB: ${missingEnvVars.join(", ")}`);
  }
}

const dbPort = Number(process.env.DB_PORT);
if (!databaseUrl && Number.isNaN(dbPort)) {
  console.warn("DB_PORT không hợp lệ, sẽ dùng mặc định 5432");
}

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  Boolean(databaseUrl?.includes("sslmode=require"));

// Tạo connection pool
const pool = new Pool(
  databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number.isNaN(dbPort) ? 5432 : dbPort,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      },
);

pool.on("error", (error) => {
  console.error("Lỗi từ pool database:", error.message);
});

const initializeDatabase = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                wallet_address VARCHAR(255) UNIQUE NOT NULL,
                nonce VARCHAR(20),                          -- ← THÊM: challenge nonce
                created_at TIMESTAMP DEFAULT NOW()
            );

            ALTER TABLE users ADD COLUMN IF NOT EXISTS nonce VARCHAR(20);

            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT,
                file_type VARCHAR(100),
                file_hash VARCHAR(255) NOT NULL,
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

            ALTER TABLE documents ADD COLUMN IF NOT EXISTS ipfs_cid VARCHAR(255);
            ALTER TABLE documents ADD COLUMN IF NOT EXISTS encrypted_key TEXT;

            ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_file_hash_key;

            CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_file_hash_owner
                ON documents(file_hash, owner_address);

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

            CREATE TABLE IF NOT EXISTS document_access_requests (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                requester_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                requester_wallet_address VARCHAR(255) NOT NULL,
                requester_name VARCHAR(255),
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                source VARCHAR(30) NOT NULL DEFAULT 'recipient_request',
                resolved_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            ALTER TABLE document_access_requests
                ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'recipient_request';

            CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
            CREATE INDEX IF NOT EXISTS idx_access_log_file_hash ON access_log(file_hash);
            CREATE INDEX IF NOT EXISTS idx_access_log_document_id ON access_log(document_id);
            CREATE INDEX IF NOT EXISTS idx_access_requests_document_id ON document_access_requests(document_id);
            CREATE INDEX IF NOT EXISTS idx_access_requests_requester_wallet ON document_access_requests(requester_wallet_address);
            CREATE INDEX IF NOT EXISTS idx_access_requests_status ON document_access_requests(status);
        `);

    console.log(
      "Kết nối database thành công và đã kiểm tra bảng users/documents!",
    );
  } catch (error: any) {
    console.error("Lỗi khởi tạo database:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
};

void initializeDatabase();

console.log(
  databaseUrl
    ? "Database mode: DATABASE_URL (Neon/managed Postgres)"
    : "Database mode: DB_HOST/DB_PORT (direct connection)",
);

export default pool;
