import { Router } from 'express'
import { mintDocument, getMyDocuments, verifyDocument } from '../controllers/documentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Tất cả đều cần đăng nhập (kết nối ví) mới dùng được
router.post('/mint', authMiddleware, mintDocument)
router.get('/', authMiddleware, getMyDocuments)
router.get('/verify/:hash', authMiddleware, verifyDocument)

export default router