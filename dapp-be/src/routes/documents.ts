import { Router } from 'express'
import { mintDocument, getMyDocuments, verifyDocument, saveIpfsCid, getRecordsByWallet, getAccessLog, getDecryptionKey, createAccessRequest, getAccessRequestsForOwner, resolveAccessRequest, getSharedDocuments } from '../controllers/documentController'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Tất cả đều cần đăng nhập (kết nối ví) mới dùng được
router.post('/mint', authMiddleware, mintDocument)
router.get('/', authMiddleware, getMyDocuments)
router.get('/:id/decryption-key', authMiddleware, getDecryptionKey)
router.post('/:id/ipfs-cid', authMiddleware, saveIpfsCid)
router.post('/:id/access-requests', authMiddleware, createAccessRequest)
router.get('/access-requests', authMiddleware, getAccessRequestsForOwner)
router.get('/shared-documents', authMiddleware, getSharedDocuments)
router.patch('/access-requests/:requestId', authMiddleware, resolveAccessRequest)
router.get('/verify/:hash', verifyDocument)
router.get('/records', getRecordsByWallet)                          // public
router.get('/access-log/:recordId', authMiddleware, getAccessLog)  // cần auth

export default router