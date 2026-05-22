import { Router } from 'express'
import { getNonce, connectWallet, refreshAccessToken, logout } from '../controllers/authController'

const router = Router()

router.get('/nonce/:address', getNonce)
router.post('/connect-wallet', connectWallet)
router.post('/refresh', refreshAccessToken)
router.post('/logout', logout)

export default router