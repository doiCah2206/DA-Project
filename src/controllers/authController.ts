import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/db'

export const connectWallet = async (req: Request, res: Response) => {
    try {
        // Lấy địa chỉ ví từ FE gửi lên
        const { wallet_address } = req.body

        // Kiểm tra có gửi lên không
        if (!wallet_address) {
            return res.status(400).json({
                message: 'Thiếu địa chỉ ví'
            })
        }

        // Tìm user theo địa chỉ ví trong database
        const existing = await pool.query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [wallet_address]
        )

        let user

        if (existing.rows.length === 0) {
            // Chưa có user → tạo mới
            const result = await pool.query(
                `INSERT INTO users (wallet_address)
                 VALUES ($1)
                 RETURNING *`,
                [wallet_address]
            )
            user = result.rows[0]
        } else {
            // Có rồi → dùng luôn
            user = existing.rows[0]
        }

        // Tạo token JWT
        const token = jwt.sign(
            { userId: user.id, wallet_address: user.wallet_address },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        )

        // Trả về FE
        res.json({
            message: 'Kết nối ví thành công!',
            token,
            user
        })

    } catch (error) {
        console.error('Lỗi connect wallet:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}