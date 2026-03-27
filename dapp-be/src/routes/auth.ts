import { Router } from 'express'
import { connectWallet } from '../controllers/authController'

const router = Router()

router.post('/connect-wallet', connectWallet)

export default router