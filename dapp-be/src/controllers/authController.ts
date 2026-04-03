import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import pool from '../config/db'

// Bước 1 — FE xin challenge nonce trước khi ký
// GET /api/auth/nonce/:address
export const getNonce = async (req: Request, res: Response) => {
    try {
        const { address } = req.params

        // Kiểm tra địa chỉ ví hợp lệ theo chuẩn Ethereum
        if (!address || !ethers.isAddress(address)) {
            return res.status(400).json({ message: 'Địa chỉ ví không hợp lệ' })
        }

        const walletAddress = address.toLowerCase()

        // Sinh nonce ngẫu nhiên 6 chữ số
        const nonce = Math.floor(Math.random() * 1_000_000).toString()

        // Lưu nonce vào DB — nếu ví chưa có thì tạo mới, có rồi thì cập nhật nonce
        await pool.query(
            `INSERT INTO users (wallet_address, nonce)
             VALUES ($1, $2)
             ON CONFLICT (wallet_address) DO UPDATE SET nonce = $2`,
            [walletAddress, nonce]
        )

        // Trả về message mẫu để FE đưa vào MetaMask ký
        res.json({
            message: `Ký message sau để xác thực ví của bạn:\n\nNonce: ${nonce}`,
            nonce,
        })
    } catch (error) {
        console.error('Lỗi getNonce:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}

// Bước 2 — FE ký nonce xong → gửi signature lên để verify và lấy JWT
// POST /api/auth/connect-wallet  { wallet_address, signature }
export const connectWallet = async (req: Request, res: Response) => {
    try {
        const { wallet_address, signature } = req.body

        // Kiểm tra FE có gửi đủ 2 field không
        if (!wallet_address || !signature) {
            return res.status(400).json({ message: 'Thiếu wallet_address hoặc signature' })
        }

        const walletAddress = wallet_address.toLowerCase()

        // Lấy nonce đang chờ của user trong DB
        const userResult = await pool.query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [walletAddress]
        )

        // Chưa gọi getNonce trước thì không có nonce → báo lỗi
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Chưa xin nonce. Gọi GET /api/auth/nonce/:address trước.' })
        }

        const user = userResult.rows[0]

        // Tái tạo lại đúng message mà FE đã ký — phải khớp hoàn toàn
        const message = `Ký message sau để xác thực ví của bạn:\n\nNonce: ${user.nonce}`

        // Recover địa chỉ từ signature — nếu FE ký đúng thì phải ra đúng ví
        let recoveredAddress: string
        try {
            recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase()
        } catch {
            return res.status(401).json({ message: 'Signature không hợp lệ' })
        }

        // So sánh địa chỉ recover được với địa chỉ FE gửi lên
        if (recoveredAddress !== walletAddress) {
            return res.status(401).json({ message: 'Signature không khớp với địa chỉ ví' })
        }

        // Rotate nonce ngay sau khi verify xong — chống replay attack
        // (dùng lại signature cũ sẽ không còn hợp lệ nữa)
        const newNonce = Math.floor(Math.random() * 1_000_000).toString()
        await pool.query(
            'UPDATE users SET nonce = $1 WHERE wallet_address = $2',
            [newNonce, walletAddress]
        )

        // Cấp JWT — payload chứa userId và wallet_address để middleware dùng sau
        const token = jwt.sign(
            { userId: user.id, wallet_address: user.wallet_address },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        )

        res.json({
            message: 'Kết nối ví thành công!',
            token,
            user: { id: user.id, wallet_address: user.wallet_address, created_at: user.created_at },
        })
    } catch (error) {
        console.error('Lỗi connect wallet:', error)
        res.status(500).json({ message: 'Lỗi server' })
    }
}