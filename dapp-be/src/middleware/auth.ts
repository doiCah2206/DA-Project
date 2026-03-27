import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Lấy token từ header Authorization — FE gửi dạng "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization

    // Không có header → chưa đăng nhập
    if (!authHeader) {
        return res.status(401).json({ message: 'Không có token' })
    }

    // Cắt chuỗi "Bearer eyJhbGci..." → lấy phần sau chữ Bearer
    const token = authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ message: 'Token không hợp lệ' })
    }

    try {
        // Giải mã token, nếu hết hạn hoặc bị sửa thì throw lỗi xuống catch
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

        // Gắn thông tin user vào req để controller sau dùng được req.user.userId
        ;(req as any).user = decoded

        // Cho request đi tiếp vào controller
        next()

    } catch (error) {
        return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ' })
    }
}