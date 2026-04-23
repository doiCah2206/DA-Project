import { Router } from 'express'
import { getNonce, connectWallet } from '../controllers/authController'

const router = Router()

router.get('/nonce/:address', getNonce)       
router.post('/connect-wallet', connectWallet) 

export default router