import { Request, Response } from 'express'
import pool from '../config/db'

// POST /api/documents/mint — lưu document sau khi FE mint NFT xong
export const mintDocument = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId // lấy userId từ JWT (middleware gắn vào)

        const {
            tokenId, fileHash, fileName, fileSize, fileType,
            title, documentType, description, ownerName,
            ownerAddress, tags, transactionHash, ipfsUri
        } = req.body

        // Kiểm tra field bắt buộc
        if (!fileHash || !fileName || !title) {
            return res.status(400).json({ message: 'Thiếu fileHash, fileName hoặc title' })
        }

        // Kiểm tra file đã notarize chưa — vì file_hash là UNIQUE
        const existing = await pool.query(
            'SELECT id FROM documents WHERE file_hash = $1',
            [fileHash]
        )
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'File này đã được notarize rồi!' })
        }

        // Lưu vào DB, RETURNING * trả về row vừa insert
        const result = await pool.query(
            `INSERT INTO documents 
                (user_id, token_id, file_hash, file_name, file_size, file_type,
                 title, document_type, description, owner_name, owner_address,
                 tags, transaction_hash, ipfs_uri)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             RETURNING *`,
            [userId, tokenId, fileHash, fileName, fileSize, fileType,
             title, documentType, description, ownerName,
             ownerAddress, tags, transactionHash, ipfsUri]
        )

        res.status(201).json({ message: 'Notarize thành công!', document: result.rows[0] })

    } catch (error) {
        console.error('Lỗi mint document:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// GET /api/documents — lấy danh sách document của user đang đăng nhập
export const getMyDocuments = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId

        // Lấy tất cả doc của user, mới nhất trước
        const result = await pool.query(
            'SELECT * FROM documents WHERE user_id = $1 ORDER BY mint_date DESC',
            [userId]
        )

        res.json({ documents: result.rows })

    } catch (error) {
        console.error('Lỗi lấy documents:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// GET /api/documents/verify/:hash — verify file theo hash, không cần đăng nhập
export const verifyDocument = async (req: Request, res: Response) => {
    try {
        const { hash } = req.params // lấy hash từ URL, vd: /verify/a3f2c8...

        if (!hash) {
            return res.status(400).json({ message: 'Thiếu hash' })
        }

        const result = await pool.query(
            'SELECT * FROM documents WHERE file_hash = $1',
            [hash]
        )

        // Không tìm thấy → chưa được notarize
        if (result.rows.length === 0) {
            return res.json({ found: false })
        }

        res.json({ found: true, document: result.rows[0] })

    } catch (error) {
        console.error('Lỗi verify:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}