import { useState, useEffect } from 'react';
import {
    Search,
    ShoppingBag,
    Filter,
    Star,
    Download,
    FileText,
    Shield,
    Tag,
    ChevronDown,
    X,
    Loader2,
    CheckCircle,
    Wallet,
    Hash,
    Calendar,
    User,
    BookOpen,
    Award,
} from 'lucide-react';
import { useAppStore } from '../store';
import type { NotarizedDocument, DocumentType } from '../types';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/contract';

type MarketListing = NotarizedDocument & {
    price?: number;
    currency?: string;
    seller_rating?: number;
    sales_count?: number;
};

type ApiRow = Record<string, unknown>;

const mapListing = (row: ApiRow): MarketListing => ({
    id: String(row.id),
    tokenId: String(row.token_id ?? ''),
    fileHash: String(row.file_hash ?? ''),
    fileName: String(row.file_name ?? ''),
    fileSize: Number(row.file_size ?? 0),
    fileType: String(row.file_type ?? ''),
    title: String(row.title ?? ''),
    documentType: (row.document_type ?? 'Other') as DocumentType,
    description: String(row.description ?? ''),
    ownerName: String(row.owner_name ?? ''),
    ownerAddress: String(row.owner_address ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    mintDate: new Date(String(row.mint_date ?? row.created_at ?? Date.now())),
    transactionHash: String(row.transaction_hash ?? ''),
    ipfsUri: String(row.ipfs_uri ?? ''),
    ipfsCid: String(row.ipfs_cid ?? ''),
    price: row.price == null ? undefined : Number(row.price),
    currency: String(row.currency ?? 'TEST'),
    seller_rating: row.seller_rating == null ? undefined : Number(row.seller_rating),
    sales_count: Number(row.sales_count ?? 0),
});

const docTypeColors: Record<string, string> = {
    Contract: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Certificate: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    'ID Document': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Legal Agreement': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    Other: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const docTypeIcons: Record<string, string> = {
    Contract: '📋',
    Certificate: '🎓',
    'ID Document': '🪪',
    'Legal Agreement': '⚖️',
    Other: '📄',
};

const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const Verify = () => {
    const { token, wallet } = useAppStore();
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<DocumentType | 'All'>('All');
    const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'price_asc' | 'price_desc'>('recent');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchaseError, setPurchaseError] = useState('');
    const [purchasedIds, setPurchasedIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadPurchased = async () => {
            if (!token || !wallet.isConnected || !wallet.address) return;
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/documents/shared-documents`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'x-wallet-address': wallet.address,
                        },
                    },
                );
                if (!res.ok) return;
                const data = await res.json() as { documents?: Array<{ id: string }> };
                if (!Array.isArray(data.documents)) return;
                const map: Record<string, boolean> = {};
                data.documents.forEach((doc) => {
                    if (doc?.id != null) {
                        map[String(doc.id)] = true;
                    }
                });
                setPurchasedIds(map);
            } catch {
                // Ignore purchase preload failures
            }
        };

        void loadPurchased();
    }, [token, wallet.isConnected, wallet.address]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/documents/marketplace`);
                if (res.ok) {
                    const data = await res.json() as { listings?: ApiRow[] };
                    if (Array.isArray(data.listings)) {
                        setListings((data.listings).map(mapListing));
                    } else {
                        setListings([]);
                    }
                } else {
                    setLoadError('Marketplace is unavailable right now. Try again in a bit.');
                }
            } catch {
                setLoadError('Marketplace is unavailable right now. Try again in a bit.');
            } finally {
                setIsLoading(false);
            }
        };
        void load();
    }, []);

    const handlePurchase = async () => {
        if (!selectedListing) return;
        if (!token || !wallet.isConnected || !wallet.address) {
            setPurchaseError('Connect your wallet to purchase documents.');
            return;
        }
        if (selectedListing.ownerAddress.toLowerCase() === wallet.address.toLowerCase()) {
            setPurchaseError('You are the owner of this document.');
            return;
        }
        if (selectedListing.price == null) {
            setPurchaseError('This listing is not priced yet.');
            return;
        }
        if (!CONTRACT_ADDRESS) {
            setPurchaseError('Missing CONTRACT_ADDRESS in dapp-fe/.env');
            return;
        }
        setIsPurchasing(true);
        setPurchaseError('');
        try {
            const { BrowserProvider, Contract, parseEther } = await import('ethers');
            if (!window.ethereum) throw new Error('Khong tim thay vi Web3');
            const currentChainId = await window.ethereum.request<string>({ method: 'eth_chainId' });
            if (currentChainId !== '0x5aff') {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x5aff' }],
                    });
                } catch {
                    throw new Error('Vui long chuyen sang mang Oasis Sapphire Testnet truoc khi mua');
                }
            }

            const browserProvider = new BrowserProvider(window.ethereum);
            const signer = await browserProvider.getSigner();
            const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const hashBytes32 = selectedListing.fileHash.startsWith('0x')
                ? selectedListing.fileHash
                : `0x${selectedListing.fileHash}`;
            const tx = await contract.buyDocument(hashBytes32, {
                value: parseEther(selectedListing.price.toString()),
            });
            await tx.wait();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/documents/${selectedListing.id}/purchase`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                        'x-wallet-address': wallet.address,
                    },
                }
            );
            if (!response.ok) {
                const d = await response.json().catch(() => ({})) as { message?: string };
                throw new Error(d.message || 'Purchase failed');
            }
            setPurchasedIds((prev) => ({ ...prev, [selectedListing.id]: true }));
            setPurchaseSuccess(true);
        } catch (err) {
            setPurchaseError(err instanceof Error ? err.message : 'Purchase failed');
        } finally {
            setIsPurchasing(false);
        }
    };

    const openModal = (listing: MarketListing) => {
        setSelectedListing(listing);
        setPurchaseSuccess(false);
        setPurchaseError('');
    };

    const closeModal = () => {
        if (isPurchasing) return;
        setSelectedListing(null);
        setPurchaseSuccess(false);
        setPurchaseError('');
    };

    const isPurchased = (listingId: string) => Boolean(purchasedIds[listingId]);
    const isOwnerListing = (listing: MarketListing) => (
        wallet.address
            ? listing.ownerAddress.toLowerCase() === wallet.address.toLowerCase()
            : false
    );

    const filtered = listings
        .filter((l) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                l.title.toLowerCase().includes(q) ||
                l.ownerName.toLowerCase().includes(q) ||
                l.description.toLowerCase().includes(q) ||
                l.tags.some((t) => t.toLowerCase().includes(q))
            );
        })
        .filter((l) => filterType === 'All' || l.documentType === filterType)
        .sort((a, b) => {
            if (sortBy === 'popular') return (b.sales_count ?? 0) - (a.sales_count ?? 0);
            if (sortBy === 'price_asc') {
                const priceA = a.price ?? Number.POSITIVE_INFINITY;
                const priceB = b.price ?? Number.POSITIVE_INFINITY;
                return priceA - priceB;
            }
            if (sortBy === 'price_desc') {
                const priceA = a.price ?? Number.NEGATIVE_INFINITY;
                const priceB = b.price ?? Number.NEGATIVE_INFINITY;
                return priceB - priceA;
            }
            return new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime();
        });

    const totalSold = listings.reduce((s, l) => s + (l.sales_count ?? 0), 0);
    const docTypes: (DocumentType | 'All')[] = ['All', 'Contract', 'Certificate', 'ID Document', 'Legal Agreement', 'Other'];

    return (
        <div className="min-h-screen bg-[#F5F2EA] text-[#111418] py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div className="max-w-7xl mx-auto">
                <div className="relative overflow-hidden rounded-[28px] border border-[#E3DED1] bg-gradient-to-br from-[#FDF9EF] via-[#F2F7F1] to-[#EAF1FF] p-8 sm:p-10 mb-10">
                    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#8CD6FF]/25 blur-3xl" />
                    <div className="absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-[#FFD28C]/30 blur-3xl" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111418] text-[#FDF9EF] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                                Live Market
                            </div>
                            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-[#111418] leading-tight mb-3">
                                Verified documents,
                                <span className="block text-[#0C6CF2]">ready to trade.</span>
                            </h1>
                            <p className="text-[#4E564C] text-base max-w-xl">
                                Discover real, notarized files from wallets across the network. Pay once, access instantly — no middlemen, no edits.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: <FileText className="w-4 h-4" />, label: 'Listed', value: String(listings.length) },
                                { icon: <ShoppingBag className="w-4 h-4" />, label: 'Sold', value: String(totalSold) },
                                { icon: <Shield className="w-4 h-4" />, label: 'On-chain', value: '100%' },
                            ].map((s) => (
                                <div key={s.label} className="rounded-2xl border border-[#E3DED1] bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                                    <div className="flex items-center gap-2 text-[#0C6CF2] mb-1">
                                        {s.icon}
                                        <p className="text-xs font-medium text-[#3C4339]">{s.label}</p>
                                    </div>
                                    <p className="text-[#111418] font-semibold text-xl leading-none">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-5 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6F66]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search documents, sellers, tags..."
                            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-[#E3DED1] text-[#111418] placeholder-[#8A8F83] focus:border-[#0C6CF2] focus:ring-1 focus:ring-[#0C6CF2] transition-all text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F83] hover:text-[#111418]">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="px-4 py-3 rounded-2xl bg-white border border-[#E3DED1] text-[#111418] focus:border-[#0C6CF2] transition-all text-sm"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                    </select>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${showFilters ? 'border-[#0C6CF2] bg-[#0C6CF2]/10 text-[#0C6CF2]' : 'border-[#E3DED1] bg-white text-[#6B6F66] hover:border-[#0C6CF2]/60'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showFilters && (
                    <div className="mb-5 flex flex-wrap gap-2 p-4 rounded-2xl bg-white border border-[#E3DED1]">
                        <span className="text-[#6B6F66] text-xs self-center mr-1">Type:</span>
                        {docTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterType === type
                                    ? 'bg-[#111418] text-[#FDF9EF] border-[#111418]'
                                    : 'border-[#E3DED1] text-[#6B6F66] hover:border-[#0C6CF2]/40 hover:text-[#111418]'}`}
                            >
                                {type === 'All' ? 'All Types' : type}
                            </button>
                        ))}
                    </div>
                )}

                <p className="text-[#6B6F66] text-sm mb-6">
                    Showing <span className="text-[#111418] font-semibold">{filtered.length}</span> listings
                    {filterType !== 'All' && <> in <span className="text-[#0C6CF2]">{filterType}</span></>}
                    {search && <> for <span className="text-[#0C6CF2]">"{search}"</span></>}
                </p>

                {isLoading ? (
                    <div className="py-24 text-center text-[#6B6F66]">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#0C6CF2]" />
                        Loading marketplace...
                    </div>
                ) : loadError ? (
                    <div className="py-24 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#6B6F66]" />
                        <h3 className="font-heading text-xl font-semibold text-[#111418] mb-2">Market is quiet</h3>
                        <p className="text-[#6B6F66]">{loadError}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-24 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#6B6F66]" />
                        <h3 className="font-heading text-xl font-semibold text-[#111418] mb-2">No listings yet</h3>
                        <p className="text-[#6B6F66]">Be the first to list a verified document.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((listing, idx) => {
                            const alreadyPurchased = isPurchased(listing.id) || isOwnerListing(listing);
                            return (
                                <div
                                    key={listing.id}
                                    className="group rounded-3xl overflow-hidden flex flex-col cursor-pointer border border-[#E3DED1] bg-white shadow-[0_10px_30px_rgba(17,20,24,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,20,24,0.12)] transition-all duration-300"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                    onClick={() => openModal(listing)}
                                >
                                    <div className="h-1 w-full bg-gradient-to-r from-[#0C6CF2] via-[#38BDF8] to-[#F59E0B]" />
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-[#111418] text-white flex items-center justify-center text-xl">
                                                {docTypeIcons[listing.documentType] ?? '📄'}
                                            </div>
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${docTypeColors[listing.documentType] ?? docTypeColors['Other']}`}>
                                                {listing.documentType}
                                            </span>
                                        </div>

                                        <h3 className="font-heading font-semibold text-[#111418] text-base leading-snug mb-1.5 group-hover:text-[#0C6CF2] transition-colors line-clamp-2">
                                            {listing.title}
                                        </h3>
                                        <p className="text-[#6B6F66] text-xs leading-relaxed mb-4 line-clamp-2 flex-1">
                                            {listing.description}
                                        </p>

                                        {listing.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {listing.tags.slice(0, 3).map((tag) => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F2EA] text-[#6B6F66] text-xs border border-[#E3DED1]">
                                                        <Tag className="w-2.5 h-2.5" />{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-3 border-t border-[#E3DED1] mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#0C6CF2]/15 flex items-center justify-center text-[#0C6CF2] text-xs font-bold">
                                                    {listing.ownerName.charAt(0)}
                                                </div>
                                                <span className="text-[#6B6F66] text-xs truncate max-w-[100px]">{listing.ownerName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                <span className="text-xs text-[#111418] font-medium">
                                                    {listing.seller_rating == null ? 'New' : listing.seller_rating.toFixed(1)}
                                                </span>
                                                <span className="text-xs text-[#8A8F83] ml-0.5">· {listing.sales_count ?? 0} sold</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                {alreadyPurchased ? (
                                                    <>
                                                        <p className="text-[#2D8A57] font-bold text-lg leading-none">Đã mua</p>
                                                        <p className="text-[#8A8F83] text-xs mt-0.5">Bạn đã sở hữu</p>
                                                    </>
                                                ) : listing.price != null ? (
                                                    <>
                                                        <p className="text-[#0C6CF2] font-bold text-lg leading-none">{listing.price.toFixed(3)}</p>
                                                        <p className="text-[#6B6F66] text-xs mt-0.5">{listing.currency}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-[#6B6F66] font-semibold text-sm leading-none">Not listed</p>
                                                        <p className="text-[#8A8F83] text-xs mt-0.5">Contact seller</p>
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openModal(listing); }}
                                                disabled={listing.price == null || alreadyPurchased}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${listing.price == null
                                                    ? 'border-[#E3DED1] text-[#9AA094] bg-[#F5F2EA] cursor-not-allowed'
                                                    : alreadyPurchased
                                                        ? 'border-[#BDE9C9] text-[#2D8A57] bg-[#E9F7EE] cursor-not-allowed'
                                                        : 'border-[#0C6CF2] text-[#0C6CF2] bg-[#0C6CF2]/10 hover:bg-[#0C6CF2] hover:text-white'
                                                    }`}
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                {alreadyPurchased ? 'Owned' : 'Buy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedListing && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl border border-[#E3DED1] bg-white overflow-hidden shadow-2xl"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1 w-full bg-gradient-to-r from-[#0C6CF2] via-[#38BDF8] to-[#F59E0B]" />

                        <div className="p-6">
                            {isPurchased(selectedListing.id) || isOwnerListing(selectedListing) ? (
                                <div className="mb-5 rounded-xl bg-[#E9F7EE] border border-[#BDE9C9] p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#2D8A57] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[#2D8A57] font-semibold text-sm">Đã sở hữu</p>
                                        <p className="text-[#6B6F66] text-xs mt-1">Tài liệu này đã thuộc về bạn.</p>
                                    </div>
                                </div>
                            ) : null}
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-[#111418] text-white flex items-center justify-center text-2xl flex-shrink-0">
                                        {docTypeIcons[selectedListing.documentType] ?? '📄'}
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-lg font-bold text-[#111418] leading-snug">
                                            {selectedListing.title}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${docTypeColors[selectedListing.documentType]}`}>
                                            {selectedListing.documentType}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={closeModal} disabled={isPurchasing} className="text-[#6B6F66] hover:text-[#111418] transition-colors flex-shrink-0 ml-3">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-[#6B6F66] text-sm leading-relaxed mb-5">{selectedListing.description}</p>

                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="p-3 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#6B6F66] text-xs flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Seller</p>
                                    <p className="text-[#111418] text-sm font-medium truncate">{selectedListing.ownerName}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span className="text-xs text-[#6B6F66]">
                                            {selectedListing.seller_rating == null ? 'New' : selectedListing.seller_rating.toFixed(1)} · {selectedListing.sales_count} sold
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#6B6F66] text-xs flex items-center gap-1 mb-1"><FileText className="w-3 h-3" /> File</p>
                                    <p className="text-[#111418] text-sm font-medium truncate">{selectedListing.fileName}</p>
                                    <p className="text-[#6B6F66] text-xs mt-0.5">{formatSize(selectedListing.fileSize)}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#6B6F66] text-xs flex items-center gap-1 mb-1"><Hash className="w-3 h-3" /> Token ID</p>
                                    <p className="font-mono text-[#0C6CF2] text-sm font-bold">#{selectedListing.tokenId}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#6B6F66] text-xs flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Notarized</p>
                                    <p className="text-[#111418] text-sm font-medium">{formatDate(selectedListing.mintDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#E9F7EE] border border-[#BDE9C9] mb-5">
                                <Shield className="w-4 h-4 text-[#2D8A57] flex-shrink-0" />
                                <p className="text-[#2D8A57] text-xs font-medium">Verified on blockchain — immutable ownership proof</p>
                                <Award className="w-4 h-4 text-[#2D8A57] ml-auto flex-shrink-0" />
                            </div>

                            {selectedListing.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {selectedListing.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-0.5 rounded-md bg-[#F5F2EA] text-[#6B6F66] text-xs border border-[#E3DED1]">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {purchaseSuccess ? (
                                <div className="rounded-xl bg-[#E9F7EE] border border-[#BDE9C9] p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#2D8A57] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[#2D8A57] font-semibold text-sm">Đã mua</p>
                                        <p className="text-[#6B6F66] text-xs mt-1">Bạn đã sở hữu tài liệu này.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {(!isPurchased(selectedListing.id) && !isOwnerListing(selectedListing)) ? (
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F2EA] mb-4">
                                            <div>
                                                <p className="text-[#6B6F66] text-xs mb-1">Price</p>
                                                {selectedListing.price != null ? (
                                                    <p className="text-[#0C6CF2] font-bold text-2xl leading-none">
                                                        {selectedListing.price.toFixed(3)}
                                                        <span className="text-base font-normal text-[#6B6F66] ml-1">{selectedListing.currency}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-[#6B6F66] font-semibold text-sm leading-none">Not listed</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#6B6F66] text-xs mb-1">You receive</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Download className="w-4 h-4 text-[#0C6CF2]" />
                                                    <span className="text-[#111418] text-sm font-medium">Full file access</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    {purchaseError && (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                                            {purchaseError}
                                        </div>
                                    )}

                                    {!wallet.isConnected && (
                                        <div className="mb-4 p-3 rounded-xl bg-[#FFF3D6] border border-[#F1C27D] flex items-center gap-2 text-[#A76815] text-xs">
                                            <Wallet className="w-4 h-4 flex-shrink-0" />
                                            Connect your wallet to purchase this document.
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={closeModal}
                                            disabled={isPurchasing}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E3DED1] text-[#6B6F66] text-sm font-medium hover:border-[#0C6CF2]/40 hover:text-[#111418] transition-all disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePurchase}
                                            disabled={isPurchasing || selectedListing.price == null || isPurchased(selectedListing.id) || isOwnerListing(selectedListing)}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0C6CF2] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isPurchasing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                (isPurchased(selectedListing.id) || isOwnerListing(selectedListing)) ? 'Owned' : 'Purchase'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Verify;