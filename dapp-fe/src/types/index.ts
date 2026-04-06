export type DocumentType =
    | 'Contract'
    | 'Certificate'
    | 'ID Document'
    | 'Legal Agreement'
    | 'Other';

export interface NotarizedDocument {
    id: string;
    tokenId: string;
    fileHash: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    title: string;
    documentType: DocumentType;
    description: string;
    ownerName: string;
    ownerAddress: string;
    tags: string[];
    mintDate: Date;
    transactionHash: string;
    ipfsUri: string;
    ipfsCid?: string;
}

export interface WalletState {
    address: string | null;
    isConnected: boolean;
    network: string;
    balance: string;
}
// export type EthereumRequestParams = {
//     method: string;
//     params?: unknown[];
// };

// export type EthereumProvider = {
//     request: <T = unknown>(args: EthereumRequestParams) => Promise<T>;
// };

export interface NotarizeFormData {
    file: File | null;
    fileHash: string;
    title: string;
    documentType: DocumentType;
    description: string;
    ownerName: string;
    tags: string[];
}

export type NotarizeStep = 1 | 2 | 3 | 4;

export type MintingStatus =
    | 'idle'
    | 'preparing'
    | 'uploading'
    | 'minting'
    | 'success'
    | 'error';

export interface VerifyResult {
    found: boolean;
    document?: NotarizedDocument;
}
