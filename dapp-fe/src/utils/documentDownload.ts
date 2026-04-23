import { useAppStore } from '../store';
import type { NotarizedDocument } from '../types';

const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const sanitizeFileName = (value: string) => value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const getIpfsGatewayUrl = (ipfsUri: string, ipfsCid?: string) => {
    if (ipfsCid) {
        return `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;
    }

    if (ipfsUri.startsWith('ipfs://')) {
        return `https://gateway.pinata.cloud/ipfs/${ipfsUri.replace('ipfs://', '')}`;
    }

    return ipfsUri;
};

const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);

    for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
    }

    return bytes.buffer;
};

const decryptEncryptedBlob = async (encryptedBlob: Blob, secretKeyPayload: { key: string; iv: string }) => {
    const encryptedBuffer = await encryptedBlob.arrayBuffer();
    const keyBuffer = base64ToArrayBuffer(secretKeyPayload.key);
    const ivBuffer = base64ToArrayBuffer(secretKeyPayload.iv);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
        cryptoKey,
        encryptedBuffer
    );

    return new Blob([decryptedBuffer]);
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const decodeJwtPayload = (token: string) => {
    try {
        const payloadBase64 = token.split('.')[1];
        if (!payloadBase64) return null;
        return JSON.parse(atob(payloadBase64)) as { wallet_address?: string };
    } catch {
        return null;
    }
};

const getActiveWalletAddress = async () => {
    if (!window.ethereum) {
        throw new Error('Khong tim thay vi Web3');
    }

    const accounts = await window.ethereum.request<string[]>({ method: 'eth_accounts' });
    const address = accounts?.[0];
    if (!address) {
        throw new Error('Khong tim thay vi dang ket noi. Vui long mo MetaMask va ket noi lai.');
    }

    return address.toLowerCase();
};

const requireAuthToken = () => {
    const { token } = useAppStore.getState();
    if (!token) {
        throw new Error('Chua xac thuc. Vui long ket noi vi lai.');
    }

    const jwtPayload = decodeJwtPayload(token) as { exp?: number } | null;
    if (jwtPayload?.exp && jwtPayload.exp * 1000 <= Date.now()) {
        throw new Error('Phien dang nhap da het han. Vui long ket noi vi lai.');
    }

    return token;
};

const requireConnectedWalletSession = () => {
    const { wallet } = useAppStore.getState();

    if (!wallet.isConnected || !wallet.address) {
        throw new Error('Chua ket noi vi trong phien hien tai. Vui long nhan Connect Wallet truoc khi tai file goc.');
    }

    return wallet.address.toLowerCase();
};

export const buildCertificateContent = (document: NotarizedDocument) => {
    return [
        'Certificate of Notarization',
        '==========================',
        '',
        `Title: ${document.title}`,
        `Document Type: ${document.documentType}`,
        `Owner Name: ${document.ownerName}`,
        `Owner Address: ${document.ownerAddress}`,
        `Token ID: #${document.tokenId}`,
        `File Name: ${document.fileName}`,
        `File Hash (SHA-256): ${document.fileHash}`,
        `Mint Date: ${formatDate(document.mintDate)}`,
        `Transaction Hash: ${document.transactionHash}`,
        `IPFS URI: ${document.ipfsUri}`,
        '',
        'This certificate verifies that the document above was notarized on the blockchain.',
    ].join('\n');
};

export const downloadTextFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(fileName, blob);
};

export const downloadBlob = (fileName: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export const downloadCertificate = (document: NotarizedDocument) => {
    const content = buildCertificateContent(document);
    const fileName = `${sanitizeFileName(document.title || 'certificate')}-certificate.txt`;
    downloadTextFile(fileName, content);
};

export const downloadEncryptedFile = async (document: NotarizedDocument) => {
    requireAuthToken();

    if (!document.ipfsCid && !document.ipfsUri) {
        throw new Error('Khong tim thay IPFS URI');
    }

    const encryptedUrl = getIpfsGatewayUrl(document.ipfsUri, document.ipfsCid);
    const response = await fetch(encryptedUrl);

    if (!response.ok) {
        throw new Error(`Khong tai duoc file ma hoa (${response.status}): ${response.statusText}`);
    }

    const encryptedBlob = await response.blob();
    const encryptedName = document.fileName.endsWith('.enc')
        ? document.fileName
        : `${document.fileName}.enc`;

    downloadBlob(encryptedName, encryptedBlob);
};

export const downloadOriginalFile = async (document: NotarizedDocument) => {
    requireAuthToken();

    if (!document.ipfsCid && !document.ipfsUri) {
        throw new Error('Khong tim thay IPFS URI');
    }

    const secretKeyPayload = await fetchSecretKeyFromApi(document);

    // Download encrypted file from IPFS
    const encryptedUrl = getIpfsGatewayUrl(document.ipfsUri, document.ipfsCid);
    const response = await fetch(encryptedUrl);

    if (!response.ok) {
        throw new Error(`Khong tai duoc file ma hoa (${response.status}): ${response.statusText}`);
    }

    const encryptedBlob = await response.blob();

    // Decrypt the file
    const decryptedBlob = await decryptEncryptedBlob(encryptedBlob, secretKeyPayload);

    // Download the decrypted file
    const baseName = document.fileName.endsWith('.enc')
        ? document.fileName.slice(0, -4)
        : document.fileName;

    downloadBlob(baseName, decryptedBlob);
};

const fetchSecretKeyFromApi = async (document: NotarizedDocument) => {
    const token = requireAuthToken();
    const connectedWallet = requireConnectedWalletSession();
    const activeWallet = await getActiveWalletAddress();

    if (activeWallet !== connectedWallet) {
        throw new Error('Vi dang active khong khop voi vi da ket noi trong phien hien tai. Vui long ket noi lai.');
    }

    const jwtPayload = decodeJwtPayload(token);
    const jwtWallet = jwtPayload?.wallet_address?.toLowerCase();
    if (jwtWallet && jwtWallet !== activeWallet) {
        throw new Error('Ví MetaMask hiện tại không khớp phiên đăng nhập. Vui lòng kết nối lại ví.');
    }

    if (!document.id) {
        throw new Error('Document khong hop le');
    }

    const response = await fetch(`${API}/documents/${document.id}/decryption-key`, {
        headers: {
            Authorization: `Bearer ${token}`,
            'x-wallet-address': activeWallet,
        },
    });

    const data = await response.json().catch(() => ({} as { message?: string }));
    if (!response.ok) {
        const message = data?.message || `Khong lay duoc khoa giai ma (${response.status})`;
        throw new Error(message);
    }

    const payload = data?.decryptionKeyPayload as { key?: string; iv?: string } | undefined;
    if (!payload?.key || !payload?.iv) {
        throw new Error('Server tra ve decryption key khong hop le');
    }

    return { key: payload.key, iv: payload.iv };
};