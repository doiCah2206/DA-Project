import { create } from 'zustand';
import type { WalletState, NotarizedDocument } from '../types';

type EthereumRequestParams = {
    method: string;
    params?: unknown[];
};

type EthereumProvider = {
    request: <T = unknown>(args: EthereumRequestParams) => Promise<T>;
};

interface AppStore {
    // Wallet state
    wallet: WalletState;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;

    // Documents state
    documents: NotarizedDocument[];
    addDocument: (doc: NotarizedDocument) => void;

    // Modal state
    selectedDocument: NotarizedDocument | null;
    setSelectedDocument: (doc: NotarizedDocument | null) => void;
}

// Mock data for demo purposes
const MOCK_DOCUMENTS: NotarizedDocument[] = [
    {
        id: '1',
        tokenId: '1247',
        fileHash: 'a3f2c8e9d4b7f1a6c5e8d3b2a1f4e7c9d8b6a4f2c1e8d3b7a5f4c2e1d8b6a',
        fileName: 'employment_contract.pdf',
        fileSize: 245000,
        fileType: 'application/pdf',
        title: 'Employment Contract - John Doe',
        documentType: 'Contract',
        description: 'Employment agreement between TechCorp and John Doe for software developer position.',
        ownerName: 'John Doe',
        ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5b3E8',
        tags: ['employment', 'contract', 'techcorp'],
        mintDate: new Date('2024-01-15T10:30:00'),
        transactionHash: '0x8a7b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a',
        ipfsUri: 'ipfs://QmX7Y8Z9...',
    },
    {
        id: '2',
        tokenId: '1248',
        fileHash: 'b4e3d9f0a5c8e1b6d7f2a3c4b5e8d1f0c9a7b6d5e4f3c2a1b8d7e6f5c4a3b2d',
        fileName: 'university_diploma.pdf',
        fileSize: 180000,
        fileType: 'application/pdf',
        title: 'Bachelor Degree Certificate',
        documentType: 'Certificate',
        description: 'Bachelor of Science in Computer Science from MIT.',
        ownerName: 'Jane Smith',
        ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5b3E8',
        tags: ['education', 'degree', 'mit'],
        mintDate: new Date('2024-02-20T14:45:00'),
        transactionHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
        ipfsUri: 'ipfs://QmY9A1Z0...',
    },
    {
        id: '3',
        tokenId: '1249',
        fileHash: 'c5f4e0a1b6d9f2c7e8a3b4d5f6e9c0b1d2a8b7c6e5f4d3a2b1c9d8e7f6a5b4c',
        fileName: 'business_license.pdf',
        fileSize: 520000,
        fileType: 'application/pdf',
        title: 'Business License - TechStart Inc',
        documentType: 'Legal Agreement',
        description: 'Official business license for TechStart Inc. registered in Delaware.',
        ownerName: 'TechStart Inc.',
        ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f5b3E8',
        tags: ['business', 'license', 'delaware'],
        mintDate: new Date('2024-03-10T09:15:00'),
        transactionHash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
        ipfsUri: 'ipfs://QmZ2B3A1...',
    },
];

const CHAIN_NAMES: Record<string, string> = {
    '0x1': 'Ethereum Mainnet',
    '0x5afe': 'Oasis Sapphire Mainnet',
    '0x5aff': 'Oasis Sapphire Testnet',
};

const getEthereumProvider = (): EthereumProvider | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.ethereum ?? null;
};

const formatEthBalance = (balanceHex: string): string => {
    const wei = BigInt(balanceHex);
    const weiPerEth = 10n ** 18n;
    const whole = wei / weiPerEth;
    const fraction = (wei % weiPerEth)
        .toString()
        .padStart(18, '0')
        .slice(0, 4)
        .replace(/0+$/, '');

    return fraction ? `${whole}.${fraction}` : `${whole}.0`;
};

export const useAppStore = create<AppStore>((set) => ({
    // Wallet state
    wallet: {
        address: null,
        isConnected: false,
        network: 'Oasis Sapphire Mainnet',
        balance: '0.00',
    },
    connectWallet: async () => {
        const provider = getEthereumProvider();

        if (!provider) {
            alert('Không tìm thấy ví Web3. Vui lòng cài MetaMask hoặc Rabby.');
            return;
        }

        try {
            const accounts = await provider.request<string[]>({
                method: 'eth_requestAccounts',
            });

            const address = accounts[0];

            if (!address) {
                alert('Không lấy được địa chỉ ví. Vui lòng thử lại.');
                return;
            }

            const [balanceHex, chainId] = await Promise.all([
                provider.request<string>({
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                }),
                provider.request<string>({ method: 'eth_chainId' }),
            ]);

            set({
                wallet: {
                    address,
                    isConnected: true,
                    network: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
                    balance: formatEthBalance(balanceHex),
                },
            });
        } catch {
            alert('Kết nối ví thất bại hoặc bị từ chối.');
        }
    },

    disconnectWallet: async () => {
        const provider = getEthereumProvider();

        if (provider) {
            try {
                await provider.request({
                    method: 'wallet_revokePermissions',
                    params: [{ eth_accounts: {} }],
                });
            } catch {
                // Một số ví không hỗ trợ revoke quyền; vẫn tiếp tục xóa state local.
            }
        }

        set({
            wallet: {
                address: null,
                isConnected: false,
                network: 'Oasis Sapphire Mainnet',
                balance: '0.00',
            },
        });
    },

    // Documents state
    documents: MOCK_DOCUMENTS,

    addDocument: (doc) => {
        set((state) => ({
            documents: [doc, ...state.documents],
        }));
    },

    // Modal state
    selectedDocument: null,
    setSelectedDocument: (doc) => {
        set({ selectedDocument: doc });
    },
}));
