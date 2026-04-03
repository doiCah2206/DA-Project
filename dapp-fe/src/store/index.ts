import { create } from 'zustand';
import type { WalletState, NotarizedDocument, DocumentType } from '../types';

type EthereumRequestParams = {
    method: string;
    params?: unknown[];
};

type EthereumProvider = {
    request: <T = unknown>(args: EthereumRequestParams) => Promise<T>;
};

// ← THÊM: khai báo thêm fetchDocuments và token so với bản cũ
interface AppStore {
    wallet: WalletState;
    token: string | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    documents: NotarizedDocument[];
    fetchDocuments: () => Promise<void>;
    addDocument: (doc: NotarizedDocument) => void;
    selectedDocument: NotarizedDocument | null;
    setSelectedDocument: (doc: NotarizedDocument | null) => void;
}

// ← XÓA: bỏ toàn bộ MOCK_DOCUMENTS

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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

export const useAppStore = create<AppStore>((set, get) => ({
    wallet: {
        address: null,
        isConnected: false,
        network: 'Oasis Sapphire Mainnet',
        balance: '0.00',
    },

    // ← THÊM: đọc JWT từ localStorage khi khởi tạo store (persist login qua reload)
    token: localStorage.getItem('jwt_token'),

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

            // ← THÊM: Bước 1 — xin nonce từ BE trước khi ký
            const nonceRes = await fetch(`${API_BASE}/auth/nonce/${address}`);
            const nonceData = await nonceRes.json();
            if (!nonceRes.ok) throw new Error(nonceData.message as string);

            // ← THÊM: Bước 2 — yêu cầu MetaMask ký message chứa nonce
            const signature = await provider.request<string>({
                method: 'personal_sign',
                params: [nonceData.message, address],
            });

            // ← THÊM: Bước 3 — gửi signature lên BE để xác thực và nhận JWT
            const authRes = await fetch(`${API_BASE}/auth/connect-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet_address: address, signature }),
            });
            const authData = await authRes.json();
            if (!authRes.ok) throw new Error(authData.message as string);

            // ← THÊM: lưu JWT vào localStorage để dùng lại sau khi reload
            localStorage.setItem('jwt_token', authData.token as string);

            const [balanceHex, chainId] = await Promise.all([
                provider.request<string>({
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                }),
                provider.request<string>({ method: 'eth_chainId' }),
            ]);

            if (chainId !== '0x5aff') {
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x5aff' }],
                    });
                } catch {
                    alert('Vui lòng chuyển sang mạng Oasis Sapphire Testnet trong MetaMask!');
                    return;
                }
            }

            set({
                token: authData.token as string,
                wallet: {
                    address,
                    isConnected: true,
                    network: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
                    balance: formatEthBalance(balanceHex),
                },
            });

            // ← THÊM: fetch documents ngay sau khi login thành công
            await get().fetchDocuments();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Lỗi không xác định';
            alert(`Kết nối ví thất bại: ${message}`);
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

        // ← THÊM: xóa JWT khỏi localStorage khi logout
        localStorage.removeItem('jwt_token');

        set({
            token: null,
            documents: [],                          // ← THÊM: xóa documents khi logout
            wallet: {
                address: null,
                isConnected: false,
                network: 'Oasis Sapphire Mainnet',
                balance: '0.00',
            },
        });
    },

    // ← THÊM: fetch documents thật từ BE thay vì dùng mock data
    fetchDocuments: async () => {
        const token = get().token;
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/documents`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message as string);

            // Map snake_case từ BE sang camelCase của FE
            const docs: NotarizedDocument[] = (data.documents as Record<string, unknown>[]).map((d) => ({
                id: String(d.id),
                tokenId: String(d.token_id ?? ''),
                fileHash: String(d.file_hash),
                fileName: String(d.file_name),
                fileSize: Number(d.file_size),
                fileType: String(d.file_type ?? ''),
                title: String(d.title),
                documentType: (d.document_type ?? 'Other') as DocumentType,
                description: String(d.description ?? ''),
                ownerName: String(d.owner_name ?? ''),
                ownerAddress: String(d.owner_address ?? ''),
                tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
                mintDate: new Date(String(d.mint_date ?? d.created_at)),
                transactionHash: String(d.transaction_hash ?? ''),
                ipfsUri: String(d.ipfs_uri ?? ''),
                ipfsCid: String(d.ipfs_cid ?? ''),  // ← THÊM: field mới từ Pinata
            }));

            set({ documents: docs });
        } catch (err) {
            console.error('Lỗi fetch documents:', err);
        }
    },

    // ← SỬA: khởi tạo rỗng thay vì MOCK_DOCUMENTS — dữ liệu thật load qua fetchDocuments
    documents: [],

    addDocument: (doc) => {
        set((state) => ({
            documents: [doc, ...state.documents],
        }));
    },

    selectedDocument: null,
    setSelectedDocument: (doc) => {
        set({ selectedDocument: doc });
    },
}));