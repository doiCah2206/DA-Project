import crypto from 'crypto'
import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

type DecryptionPayload = {
    key: string
    iv: string
}

type LocalEncryptedPayloadV2 = {
    version: 2
    provider: 'local'
    algorithm: string
    iv: string
    authTag: string
    ciphertext: string
}

type AwsKmsEncryptedPayloadV2 = {
    version: 2
    provider: 'aws-kms'
    keyId: string
    ciphertext: string
}

const getEncryptionKey = () => {
    const raw = process.env.KEY_ENCRYPTION_SECRET?.trim()
    if (!raw) {
        throw new Error('Missing KEY_ENCRYPTION_SECRET')
    }

    const base64Candidate = /^[A-Za-z0-9+/=]+$/.test(raw) ? Buffer.from(raw, 'base64') : null
    if (base64Candidate && base64Candidate.length === 32) {
        return base64Candidate
    }

    const utf8 = Buffer.from(raw, 'utf8')
    if (utf8.length === 32) {
        return utf8
    }

    throw new Error('KEY_ENCRYPTION_SECRET must be 32-byte utf8 or base64-encoded 32-byte value')
}

const KMS_PROVIDER = (process.env.KMS_PROVIDER ?? 'local').trim().toLowerCase()
const AWS_KMS_KEY_ID = process.env.AWS_KMS_KEY_ID?.trim() || ''
const AWS_REGION = process.env.AWS_REGION?.trim() || 'ap-southeast-1'

let kmsClient: KMSClient | null = null

const canUseAwsKms = () => KMS_PROVIDER === 'aws' && Boolean(AWS_KMS_KEY_ID)

const getKmsClient = () => {
    if (!kmsClient) {
        kmsClient = new KMSClient({ region: AWS_REGION })
    }

    return kmsClient
}

const encryptWithLocalKey = (payload: DecryptionPayload): string => {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const plaintext = JSON.stringify(payload)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    const encryptedPayload: LocalEncryptedPayloadV2 = {
        version: 2,
        provider: 'local',
        algorithm: ALGORITHM,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        ciphertext: encrypted.toString('base64'),
    }

    return JSON.stringify(encryptedPayload)
}

const decryptWithLocalKey = (encrypted: {
    iv: string
    authTag: string
    ciphertext: string
    algorithm?: string
}): DecryptionPayload => {
    const key = getEncryptionKey()

    const algorithm = encrypted.algorithm ?? ALGORITHM
    if (algorithm !== ALGORITHM) {
        throw new Error('Unsupported encryption algorithm')
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(encrypted.iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'))

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
        decipher.final(),
    ])

    const decryptedPayload = JSON.parse(decrypted.toString('utf8')) as DecryptionPayload
    if (!decryptedPayload.key || !decryptedPayload.iv) {
        throw new Error('Invalid decrypted key payload')
    }

    return decryptedPayload
}

export const encryptDecryptionPayload = async (payload: DecryptionPayload): Promise<string> => {
    if (!canUseAwsKms()) {
        return encryptWithLocalKey(payload)
    }

    try {
        const plaintext = Buffer.from(JSON.stringify(payload), 'utf8')
        const client = getKmsClient()
        const response = await client.send(new EncryptCommand({
            KeyId: AWS_KMS_KEY_ID,
            Plaintext: plaintext,
            EncryptionContext: {
                service: 'dapp-be',
                purpose: 'document-decryption-payload',
            },
        }))

        if (!response.CiphertextBlob) {
            throw new Error('AWS KMS did not return CiphertextBlob')
        }

        const encryptedPayload: AwsKmsEncryptedPayloadV2 = {
            version: 2,
            provider: 'aws-kms',
            keyId: AWS_KMS_KEY_ID,
            ciphertext: Buffer.from(response.CiphertextBlob).toString('base64'),
        }

        return JSON.stringify(encryptedPayload)
    } catch (error) {
        console.error('KMS encrypt failed, fallback to local encryption:', error)
        return encryptWithLocalKey(payload)
    }
}

export const decryptDecryptionPayload = async (encryptedPayload: string): Promise<DecryptionPayload> => {
    const parsed = JSON.parse(encryptedPayload) as {
        version?: number
        provider?: 'local' | 'aws-kms'
        iv?: string
        authTag?: string
        ciphertext?: string
        algorithm?: string
        keyId?: string
    }

    if (!parsed.ciphertext) {
        throw new Error('Invalid encrypted payload format')
    }

    if (parsed.provider === 'aws-kms') {
        const client = getKmsClient()
        const response = await client.send(new DecryptCommand({
            KeyId: parsed.keyId || AWS_KMS_KEY_ID,
            CiphertextBlob: Buffer.from(parsed.ciphertext, 'base64'),
            EncryptionContext: {
                service: 'dapp-be',
                purpose: 'document-decryption-payload',
            },
        }))

        if (!response.Plaintext) {
            throw new Error('AWS KMS did not return Plaintext')
        }

        const payload = JSON.parse(Buffer.from(response.Plaintext).toString('utf8')) as DecryptionPayload
        if (!payload.key || !payload.iv) {
            throw new Error('Invalid decrypted key payload')
        }

        return payload
    }

    if (!parsed.iv || !parsed.authTag) {
        throw new Error('Invalid local encrypted payload format')
    }

    return decryptWithLocalKey({
        iv: parsed.iv,
        authTag: parsed.authTag,
        ciphertext: parsed.ciphertext,
        algorithm: parsed.algorithm,
    })
}
