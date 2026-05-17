import { ethers } from 'ethers'
import pool from '../config/db'

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? ''

const CONTRACT_ABI = [
    'event AccessLogged(bytes32 indexed hash, address verifier, uint256 timestamp)',
    'event CertificateIssued(bytes32 indexed hash, address issuer)',
    'event CertificateRevoked(bytes32 indexed hash)',
]

export const startContractListener = async () => {
    if (!CONTRACT_ADDRESS) {
        console.warn('CONTRACT_ADDRESS chưa được set trong .env — bỏ qua listener')
        return
    }

    const provider = new ethers.JsonRpcProvider(
        process.env.SAPPHIRE_RPC ?? 'https://testnet.sapphire.oasis.io'
    )

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

    contract.on('AccessLogged', async (hash: string, verifier: string, timestamp: bigint) => {
        try {
            const hashHex = hash.replace(/^0x/, '')
            console.log(`AccessLogged: hash=${hashHex} verifier=${verifier}`)
        } catch (err) {
            console.error('Lỗi ghi access_log từ event:', err)
        }
    })

    console.log('Contract listener đã khởi động, đang lắng nghe event AccessLogged...')
}