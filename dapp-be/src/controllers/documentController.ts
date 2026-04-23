import { Request, Response } from 'express'
import pool from '../config/db'
import { decryptDecryptionPayload, encryptDecryptionPayload } from '../utils/keyEncryption'

// POST /api/documents/mint — lưu document sau khi FE mint NFT xong
export const mintDocument = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId // lấy userId từ JWT (middleware gắn vào)
        const jwtWalletAddress = String((req as any).user.wallet_address ?? '').toLowerCase()

        const {
            tokenId, fileHash, fileName, fileSize, fileType,
            title, documentType, description, ownerName,
            ownerAddress, tags, transactionHash, ipfsUri, decryptionKeyPayload
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

        if (!decryptionKeyPayload?.key || !decryptionKeyPayload?.iv) {
            return res.status(400).json({ message: 'Thiếu decryptionKeyPayload.key hoặc decryptionKeyPayload.iv' })
        }

        const normalizedOwnerAddress = String(ownerAddress ?? '').toLowerCase()
        if (!normalizedOwnerAddress) {
            return res.status(400).json({ message: 'Thiếu ownerAddress' })
        }

        if (jwtWalletAddress && normalizedOwnerAddress !== jwtWalletAddress) {
            return res.status(403).json({ message: 'ownerAddress phải khớp với ví đã xác thực.' })
        }

        const encryptedKey = await encryptDecryptionPayload({
            key: String(decryptionKeyPayload.key),
            iv: String(decryptionKeyPayload.iv),
        })

        // Lưu vào DB, RETURNING * trả về row vừa insert
        const result = await pool.query(
            `INSERT INTO documents 
                (user_id, token_id, file_hash, file_name, file_size, file_type,
                title, document_type, description, owner_name, owner_address,
                tags, transaction_hash, ipfs_uri, ipfs_cid, encrypted_key)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *`,
            [userId, tokenId, fileHash, fileName, fileSize, fileType,
                title, documentType, description, ownerName,
                normalizedOwnerAddress, tags, transactionHash, ipfsUri,
                req.body.ipfsCid ?? null, encryptedKey]
        )

        res.status(201).json({ message: 'Notarize thành công!', document: result.rows[0] })

    } catch (error) {
        console.error('Lỗi mint document:', error)
        const message = error instanceof Error ? error.message : 'Lỗi server'
        res.status(500).json({ message })
    }
}

// GET /api/documents/:id/decryption-key
export const getDecryptionKey = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId
        const jwtWalletAddress = String((req as any).user.wallet_address ?? '').toLowerCase()
        const activeWalletHeader = String(req.headers['x-wallet-address'] ?? '').toLowerCase()
        const { id } = req.params

        if (!activeWalletHeader) {
            return res.status(401).json({ message: 'Thiếu x-wallet-address' })
        }

        if (jwtWalletAddress && activeWalletHeader !== jwtWalletAddress) {
            return res.status(401).json({ message: 'Ví đang active không khớp phiên đăng nhập. Vui lòng kết nối lại ví.' })
        }

        const result = await pool.query(
            `SELECT encrypted_key, owner_address FROM documents
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy document hoặc không có quyền' })
        }

        const encryptedKey = result.rows[0].encrypted_key as string | null
        const ownerAddress = String(result.rows[0].owner_address ?? '').toLowerCase()

        if (ownerAddress && activeWalletHeader !== ownerAddress) {
            return res.status(403).json({ message: 'Ví hiện tại không có quyền tải file gốc này.' })
        }

        if (!encryptedKey) {
            return res.status(404).json({ message: 'Document không có decryption key' })
        }

        const decryptionKeyPayload = await decryptDecryptionPayload(encryptedKey)
        return res.json({ decryptionKeyPayload })
    } catch (error) {
        console.error('Lỗi getDecryptionKey:', error)
        const message = error instanceof Error ? error.message : 'Lỗi server'
        return res.status(500).json({ message })
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
        const { hash } = req.params

        if (!hash) {
            return res.status(400).json({ message: 'Thiếu hash' })
        }

        const result = await pool.query(
            'SELECT * FROM documents WHERE file_hash = $1',
            [hash]
        )

        const found = result.rows.length > 0
        const documentId = found ? result.rows[0].id : null

        // ← THÊM: ghi access_log
        await pool.query(
            `INSERT INTO access_log (document_id, file_hash, ip_address, user_agent, found)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                documentId,
                hash,
                req.ip ?? req.socket.remoteAddress,
                req.headers['user-agent'] ?? null,
                found,
            ]
        )

        if (!found) {
            return res.json({ found: false })
        }

        res.json({ found: true, document: result.rows[0] })

    } catch (error) {
        console.error('Lỗi verify:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// POST /api/documents/:id/ipfs-cid
export const saveIpfsCid = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId
        const { id } = req.params
        const { ipfs_cid } = req.body

        if (!ipfs_cid) {
            return res.status(400).json({ message: 'Thiếu ipfs_cid' })
        }

        // Chỉ cho phép update document của chính user đó
        const result = await pool.query(
            `UPDATE documents SET ipfs_cid = $1
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [ipfs_cid, id, userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy document hoặc không có quyền' })
        }

        res.json({ message: 'Lưu IPFS CID thành công', document: result.rows[0] })

    } catch (error) {
        console.error('Lỗi saveIpfsCid:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// GET /api/documents/records?wallet=0x... — lấy records theo địa chỉ ví
export const getRecordsByWallet = async (req: Request, res: Response) => {
    try {
        const { wallet } = req.query
        if (!wallet) return res.status(400).json({ message: 'Thiếu wallet address' })

        const result = await pool.query(
            'SELECT * FROM documents WHERE owner_address = $1 ORDER BY mint_date DESC',
            [String(wallet).toLowerCase()]
        )
        res.json({ documents: result.rows })
    } catch (error) {
        console.error('Lỗi getRecordsByWallet:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// GET /api/documents/access-log/:recordId — lấy access log của 1 document
export const getAccessLog = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId
        const { recordId } = req.params

        // Chỉ cho phép xem log của document thuộc về user đó
        const docCheck = await pool.query(
            'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
            [recordId, userId]
        )
        if (docCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Không có quyền xem log này' })
        }

        const result = await pool.query(
            `SELECT * FROM access_log 
             WHERE document_id = $1 
             ORDER BY accessed_at DESC`,
            [recordId]
        )
        res.json({ logs: result.rows })
    } catch (error) {
        console.error('Lỗi getAccessLog:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}