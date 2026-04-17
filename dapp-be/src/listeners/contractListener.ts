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
            // Tìm document_id theo file_hash
            const hashHex = hash.replace(/^0x/, '')
            const docResult = await pool.query(
                'SELECT id FROM documents WHERE file_hash = $1 ORDER BY mint_date DESC LIMIT 1',
                [hashHex]
            )
            const documentId = docResult.rows.length > 0 ? docResult.rows[0].id : null

            await pool.query(
                `INSERT INTO access_log (document_id, file_hash, ip_address, user_agent, found, viewer_address, action, accessed_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8))`,
                [
                    documentId,
                    hashHex,
                    null,           // ip không có từ on-chain
                    null,           // user_agent không có từ on-chain
                    documentId !== null,
                    verifier,       // địa chỉ ví người verify
                    'verify',
                    Number(timestamp),
                ]
            )
            console.log(`AccessLogged: hash=${hashHex} verifier=${verifier}`)
        } catch (err) {
            console.error('Lỗi ghi access_log từ event:', err)
        }
    })

    console.log('Contract listener đã khởi động, đang lắng nghe event AccessLogged...')
}