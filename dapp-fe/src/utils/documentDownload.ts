import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../constants/contract';
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

const parseSecretKeyPayload = (secretKey: string) => {
    const payload = JSON.parse(secretKey) as { key: string; iv: string };
    return payload;
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

export const downloadOriginalFile = async (document: NotarizedDocument) => {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Missing contract address');
    }

    if (!window.ethereum) {
        throw new Error('Khong tim thay vi Web3');
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const hashBytes32 = document.fileHash.startsWith('0x') ? document.fileHash : `0x${document.fileHash}`;

    const [, , , , secretKey] = await contract.getMyRecord(hashBytes32) as [
        string,
        bigint,
        boolean,
        string,
        string,
        string,
        string
    ];

    const secretKeyPayload = parseSecretKeyPayload(secretKey);
    const encryptedUrl = getIpfsGatewayUrl(document.ipfsUri, document.ipfsCid);
    const response = await fetch(encryptedUrl);

    if (!response.ok) {
        throw new Error(`Khong tai duoc file ma hoa (${response.status})`);
    }

    const encryptedBlob = await response.blob();
    const decryptedBlob = await decryptEncryptedBlob(encryptedBlob, secretKeyPayload);

    const baseName = document.fileName.endsWith('.enc')
        ? document.fileName.slice(0, -4)
        : document.fileName;

    downloadBlob(baseName, decryptedBlob);
};