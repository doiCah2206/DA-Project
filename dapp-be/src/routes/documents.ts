import { Router } from 'express'
import { mintDocument, getMyDocuments, verifyDocument, saveIpfsCid, getRecordsByWallet, getAccessLog } from '../controllers/documentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Tất cả đều cần đăng nhập (kết nối ví) mới dùng được
router.post('/mint', authMiddleware, mintDocument)
router.get('/', authMiddleware, getMyDocuments)
router.post('/:id/ipfs-cid', authMiddleware, saveIpfsCid)
router.get('/verify/:hash', verifyDocument)
router.get('/records', getRecordsByWallet)                          // public
router.get('/access-log/:recordId', authMiddleware, getAccessLog)  // cần auth

export default router