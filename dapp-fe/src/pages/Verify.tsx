import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    ShoppingBag,
    Filter,
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
} from "lucide-react";
import { useAppStore } from "../store";
import type { NotarizedDocument, DocumentType } from "../types";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type MarketListing = NotarizedDocument & {
    price?: number;
    currency?: string;
    seller_rating?: number;
    sales_count?: number;
};

type ApiRow = Record<string, unknown>;

const mapListing = (row: ApiRow): MarketListing => ({
    id: String(row.id),
    tokenId: String(row.token_id ?? ""),
    fileHash: String(row.file_hash ?? ""),
    fileName: String(row.file_name ?? ""),
    fileSize: Number(row.file_size ?? 0),
    fileType: String(row.file_type ?? ""),
    title: String(row.title ?? ""),
    documentType: (row.document_type ?? "Other") as DocumentType,
    description: String(row.description ?? ""),
    ownerName: String(row.owner_name ?? ""),
    ownerAddress: String(row.owner_address ?? ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    mintDate: new Date(String(row.mint_date ?? row.created_at ?? Date.now())),
    transactionHash: String(row.transaction_hash ?? ""),
    ipfsUri: String(row.ipfs_uri ?? ""),
    ipfsCid: String(row.ipfs_cid ?? ""),
    price: row.price == null ? undefined : Number(row.price),
    currency: String(row.currency ?? "TEST"),
    seller_rating:
        row.seller_rating == null ? undefined : Number(row.seller_rating),
    sales_count: Number(row.sales_count ?? 0),
});

// Category badge styles — matching Marketplace_v3.html design
const categoryBadgeStyle: Record<
    string,
    { bg: string; text: string; border: string }
> = {
    Contract: { bg: "#EAF0FD", text: "#2D5FA8", border: "#A8BEDE" },
    Certificate: { bg: "#EDE6FE", text: "#6A28B8", border: "#C4A8E8" },
    "ID Document": { bg: "#E6F4F0", text: "#2D8A6E", border: "#A8D9CC" },
    "Legal Agreement": { bg: "#FEF3E6", text: "#B86A00", border: "#F5C882" },
    "Research Paper": { bg: "#FCE6F4", text: "#A0289A", border: "#E8A8E0" },
    Other: { bg: "#F0ECE6", text: "#7A6A56", border: "#D4C9B8" },
};

const getCatStyle = (type: string) =>
    categoryBadgeStyle[type] ?? categoryBadgeStyle["Other"];

const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const Verify = () => {
    const { token, wallet } = useAppStore();
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<DocumentType | "All">("All");
    const [sortBy, setSortBy] = useState<
        "recent" | "popular" | "price_asc" | "price_desc"
    >("recent");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedListing, setSelectedListing] =
        useState<MarketListing | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const [purchaseError, setPurchaseError] = useState("");
    const [purchasedIds, setPurchasedIds] = useState<Record<string, boolean>>(
        {},
    );

    const heroRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const filterPanelRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    // ── Load purchased docs ──
    useEffect(() => {
        const loadPurchased = async () => {
            if (!token || !wallet.isConnected || !wallet.address) return;
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/shared-documents`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "x-wallet-address": wallet.address,
                        },
                    },
                );
                if (!res.ok) return;
                const data = (await res.json()) as {
                    documents?: Array<{ id: string }>;
                };
                if (!Array.isArray(data.documents)) return;
                const map: Record<string, boolean> = {};
                data.documents.forEach((doc) => {
                    if (doc?.id != null) map[String(doc.id)] = true;
                });
                setPurchasedIds(map);
            } catch {
                /* ignore */
            }
        };
        void loadPurchased();
    }, [token, wallet.isConnected, wallet.address]);

    // ── Load marketplace ──
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/marketplace`,
                );
                if (res.ok) {
                    const data = (await res.json()) as { listings?: ApiRow[] };
                    setListings(
                        Array.isArray(data.listings)
                            ? data.listings.map(mapListing)
                            : [],
                    );
                } else {
                    setLoadError(
                        "Marketplace is unavailable right now. Try again in a bit.",
                    );
                }
            } catch {
                setLoadError(
                    "Marketplace is unavailable right now. Try again in a bit.",
                );
            } finally {
                setIsLoading(false);
            }
        };
        void load();
    }, []);

    // ── GSAP: Hero entrance ──
    useEffect(() => {
        if (!heroRef.current) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.from(".hero-badge", { opacity: 0, y: -20, duration: 0.5 })
                .from(
                    ".hero-title",
                    { opacity: 0, y: 40, duration: 0.7 },
                    "-=0.2",
                )
                .from(
                    ".hero-sub",
                    { opacity: 0, y: 30, duration: 0.6 },
                    "-=0.3",
                )
                .from(
                    ".stat-box",
                    {
                        opacity: 0,
                        y: 20,
                        scale: 0.95,
                        stagger: 0.12,
                        duration: 0.5,
                    },
                    "-=0.2",
                );
        }, heroRef);
        return () => ctx.revert();
    }, []);

    // ── GSAP: Stats counter ──
    useEffect(() => {
        if (!statsRef.current || isLoading) return;
        const ctx = gsap.context(() => {
            statsRef.current!.querySelectorAll(".stat-number").forEach((el) => {
                const target = parseInt(
                    el.getAttribute("data-value") || "0",
                    10,
                );
                gsap.fromTo(
                    el,
                    { innerText: 0 },
                    {
                        innerText: target,
                        duration: 1.5,
                        ease: "power2.out",
                        snap: { innerText: 1 },
                        delay: 0.5,
                    },
                );
            });
        });
        return () => ctx.revert();
    }, [isLoading, listings.length]);

    // ── GSAP: 3D tilt ──
    const handleCardMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const el = e.currentTarget;
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
            gsap.to(el, {
                rotateX: y,
                rotateY: x,
                duration: 0.3,
                ease: "power2.out",
                transformPerspective: 800,
            });
        },
        [],
    );

    const handleCardMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            gsap.to(e.currentTarget, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: "elastic.out(1,0.5)",
            });
        },
        [],
    );

    // ── GSAP: Modal open/close ──
    const openModal = useCallback((listing: MarketListing) => {
        setSelectedListing(listing);
        setPurchaseSuccess(false);
        setPurchaseError("");
        requestAnimationFrame(() => {
            if (modalRef.current && modalContentRef.current) {
                gsap.fromTo(
                    modalRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" },
                );
                gsap.fromTo(
                    modalContentRef.current,
                    { opacity: 0, y: 40, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.4,
                        ease: "back.out(1.7)",
                        delay: 0.1,
                    },
                );
            }
        });
    }, []);

    const closeModal = useCallback(() => {
        if (isPurchasing) return;
        if (modalRef.current && modalContentRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    setSelectedListing(null);
                    setPurchaseSuccess(false);
                    setPurchaseError("");
                },
            });
            tl.to(modalContentRef.current, {
                opacity: 0,
                y: 30,
                scale: 0.95,
                duration: 0.25,
                ease: "power2.in",
            });
            tl.to(
                modalRef.current,
                { opacity: 0, duration: 0.2, ease: "power2.in" },
                "-=0.1",
            );
        } else {
            setSelectedListing(null);
            setPurchaseSuccess(false);
            setPurchaseError("");
        }
    }, [isPurchasing]);

    // ── GSAP: Filter panel ──
    const toggleFilters = useCallback(() => {
        if (!showFilters) {
            setShowFilters(true);
            requestAnimationFrame(() => {
                if (filterPanelRef.current)
                    gsap.fromTo(
                        filterPanelRef.current,
                        { height: 0, opacity: 0 },
                        {
                            height: "auto",
                            opacity: 1,
                            duration: 0.35,
                            ease: "power2.out",
                        },
                    );
            });
        } else {
            if (filterPanelRef.current) {
                gsap.to(filterPanelRef.current, {
                    height: 0,
                    opacity: 0,
                    duration: 0.25,
                    ease: "power2.in",
                    onComplete: () => setShowFilters(false),
                });
            } else {
                setShowFilters(false);
            }
        }
    }, [showFilters]);

    // ── Purchase handler ──
    const handlePurchase = async () => {
        if (!selectedListing) return;
        if (!token || !wallet.isConnected || !wallet.address) {
            setPurchaseError("Connect your wallet to purchase documents.");
            return;
        }
        if (
            selectedListing.ownerAddress.toLowerCase() ===
            wallet.address.toLowerCase()
        ) {
            setPurchaseError("You are the owner of this document.");
            return;
        }
        if (selectedListing.price == null) {
            setPurchaseError("This listing is not priced yet.");
            return;
        }
        if (!CONTRACT_ADDRESS) {
            setPurchaseError("Missing CONTRACT_ADDRESS in dapp-fe/.env");
            return;
        }
        setIsPurchasing(true);
        setPurchaseError("");
        try {
            const { BrowserProvider, Contract, parseEther } =
                await import("ethers");
            if (!window.ethereum) throw new Error("Khong tim thay vi Web3");
            const currentChainId = await window.ethereum.request<string>({
                method: "eth_chainId",
            });
            if (currentChainId !== "0x5aff") {
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x5aff" }],
                    });
                } catch {
                    throw new Error(
                        "Vui long chuyen sang mang Oasis Sapphire Testnet truoc khi mua",
                    );
                }
            }
            const browserProvider = new BrowserProvider(window.ethereum);
            const signer = await browserProvider.getSigner();
            const contract = new Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                signer,
            );
            const hashBytes32 = selectedListing.fileHash.startsWith("0x")
                ? selectedListing.fileHash
                : `0x${selectedListing.fileHash}`;
            const tx = await contract.buyDocument(hashBytes32, {
                value: parseEther(selectedListing.price.toString()),
            });
            await tx.wait();
            const response = await fetch(
                `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/${selectedListing.id}/purchase`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        "x-wallet-address": wallet.address,
                    },
                },
            );
            if (!response.ok) {
                const d = (await response.json().catch(() => ({}))) as {
                    message?: string;
                };
                throw new Error(d.message || "Purchase failed");
            }
            setPurchasedIds((prev) => ({
                ...prev,
                [selectedListing.id]: true,
            }));
            setPurchaseSuccess(true);
        } catch (err) {
            setPurchaseError(
                err instanceof Error ? err.message : "Purchase failed",
            );
        } finally {
            setIsPurchasing(false);
        }
    };

    const isPurchased = (id: string) => Boolean(purchasedIds[id]);
    const isOwnerListing = (l: MarketListing) =>
        wallet.address
            ? l.ownerAddress.toLowerCase() === wallet.address.toLowerCase()
            : false;
    const isNewListing = (l: MarketListing) =>
        new Date(l.mintDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
        .filter((l) => filterType === "All" || l.documentType === filterType)
        .sort((a, b) => {
            if (sortBy === "popular")
                return (b.sales_count ?? 0) - (a.sales_count ?? 0);
            if (sortBy === "price_asc")
                return (a.price ?? Infinity) - (b.price ?? Infinity);
            if (sortBy === "price_desc")
                return (b.price ?? -Infinity) - (a.price ?? -Infinity);
            return (
                new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime()
            );
        });

    const totalSold = listings.reduce((s, l) => s + (l.sales_count ?? 0), 0);
    const docTypes: (DocumentType | "All")[] = [
        "All",
        "Document",
        "Template",
        "Guide & Report",
        "Creative Asset",
        "Digital Resource",
        "Other",
    ];

    // ── GSAP: Staggered card reveal ──
    useEffect(() => {
        if (!gridRef.current || filtered.length === 0) return;
        const cards = gridRef.current.querySelectorAll(".market-card");
        if (cards.length === 0) return;
        const ctx = gsap.context(() => {
            gsap.from(cards, {
                opacity: 0,
                y: 50,
                scale: 0.95,
                stagger: 0.1,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: { trigger: gridRef.current, start: "top 85%" },
            });
        });
        return () => ctx.revert();
    }, [filtered.length, filterType, sortBy, search]);

    return (
        <div
            className="min-h-screen bg-[#F5F2EA] text-[#111418] py-10 px-4 sm:px-6 lg:px-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="max-w-7xl mx-auto">
                {/* ── HERO BANNER ── */}
                <div
                    ref={heroRef}
                    className="relative overflow-hidden rounded-[28px] border border-[#E3DED1] bg-gradient-to-br from-[#FDF9EF] via-[#F2F7F1] to-[#EAF1FF] p-8 sm:p-10 mb-10"
                >
                    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#8CD6FF]/25 blur-3xl" />
                    <div className="absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-[#FFD28C]/30 blur-3xl" />
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                        <div>
                            <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111418] text-[#FDF9EF] text-xs font-semibold tracking-[0.2em] uppercase mb-4">
                                Live Market
                            </div>
                            <h1 className="hero-title font-heading text-4xl sm:text-5xl font-bold text-[#111418] leading-tight mb-3">
                                Verified documents,
                                <span className="block text-[#0C6CF2]">
                                    ready to trade.
                                </span>
                            </h1>
                            <p className="hero-sub text-[#4E564C] text-base max-w-xl">
                                Discover real, notarized files from wallets
                                across the network. Pay once, access instantly —
                                no middlemen, no edits.
                            </p>
                        </div>
                        <div ref={statsRef} className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    icon: <FileText className="w-4 h-4" />,
                                    label: "Listed",
                                    value: listings.length,
                                },
                                {
                                    icon: <ShoppingBag className="w-4 h-4" />,
                                    label: "Sold",
                                    value: totalSold,
                                },
                                {
                                    icon: <Shield className="w-4 h-4" />,
                                    label: "On-chain",
                                    value: 100,
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="stat-box rounded-2xl border border-[#E3DED1] bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                                >
                                    <div className="flex items-center gap-2 text-[#0C6CF2] mb-1">
                                        {s.icon}
                                        <p className="text-xs font-medium text-[#3C4339]">
                                            {s.label}
                                        </p>
                                    </div>
                                    <p className="text-[#111418] font-semibold text-xl leading-none">
                                        <span
                                            className="stat-number"
                                            data-value={s.value}
                                        >
                                            0
                                        </span>
                                        {s.label === "On-chain" ? "%" : ""}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── SEARCH & SORT ── */}
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
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F83] hover:text-[#111418]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) =>
                            setSortBy(e.target.value as typeof sortBy)
                        }
                        className="px-4 py-3 rounded-2xl bg-white border border-[#E3DED1] text-[#111418] focus:border-[#0C6CF2] transition-all text-sm"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                    </select>
                    <button
                        onClick={toggleFilters}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${showFilters ? "border-[#0C6CF2] bg-[#0C6CF2]/10 text-[#0C6CF2]" : "border-[#E3DED1] bg-white text-[#6B6F66] hover:border-[#0C6CF2]/60"}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        <ChevronDown
                            className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`}
                        />
                    </button>
                </div>

                {/* ── FILTER PANEL ── */}
                {showFilters && (
                    <div ref={filterPanelRef} className="mb-5 overflow-hidden">
                        <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-white border border-[#E3DED1]">
                            <span className="text-[#6B6F66] text-xs self-center mr-1">
                                Type:
                            </span>
                            {docTypes.map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        filterType === type
                                            ? "bg-[#111418] text-[#FDF9EF] border-[#111418]"
                                            : "border-[#E3DED1] text-[#6B6F66] hover:border-[#0C6CF2]/40 hover:text-[#111418]"
                                    }`}
                                >
                                    {type === "All" ? "All Types" : type}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-[#6B6F66] text-sm mb-6">
                    Showing{" "}
                    <span className="text-[#111418] font-semibold">
                        {filtered.length}
                    </span>{" "}
                    listings
                    {filterType !== "All" && (
                        <>
                            {" "}
                            in{" "}
                            <span className="text-[#0C6CF2]">{filterType}</span>
                        </>
                    )}
                    {search && (
                        <>
                            {" "}
                            for{" "}
                            <span className="text-[#0C6CF2]">"{search}"</span>
                        </>
                    )}
                </p>

                {/* ── LISTINGS GRID ── */}
                {isLoading ? (
                    <div className="py-24 text-center text-[#6B6F66]">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#0C6CF2]" />
                        Loading marketplace...
                    </div>
                ) : loadError ? (
                    <div className="py-24 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#6B6F66]" />
                        <h3 className="font-heading text-xl font-semibold text-[#111418] mb-2">
                            Market is quiet
                        </h3>
                        <p className="text-[#6B6F66]">{loadError}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-24 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#6B6F66]" />
                        <h3 className="font-heading text-xl font-semibold text-[#111418] mb-2">
                            No listings yet
                        </h3>
                        <p className="text-[#6B6F66]">
                            Be the first to list a verified document.
                        </p>
                    </div>
                ) : (
                    <div
                        ref={gridRef}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {filtered.map((listing) => {
                            const isOwner = isOwnerListing(listing);
                            const hasPurchased = isPurchased(listing.id);
                            const catStyle = getCatStyle(listing.documentType);
                            return (
                                <div
                                    key={listing.id}
                                    className="market-card group rounded-2xl overflow-hidden flex flex-col cursor-pointer bg-white border border-[#E3DED1] shadow-[0_4px_16px_rgba(17,20,24,0.06)] hover:shadow-[0_12px_32px_rgba(17,20,24,0.12)] transition-shadow duration-300"
                                    style={{ transformStyle: "preserve-3d" }}
                                    onClick={() => openModal(listing)}
                                    onMouseMove={handleCardMouseMove}
                                    onMouseLeave={handleCardMouseLeave}
                                >
                                    <div className="p-5 flex flex-col flex-1 gap-3">
                                        {/* ── Category + NEW badge ── */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md border"
                                                style={{
                                                    backgroundColor:
                                                        catStyle.bg,
                                                    color: catStyle.text,
                                                    borderColor:
                                                        catStyle.border,
                                                }}
                                            >
                                                {listing.documentType.toUpperCase()}
                                            </span>
                                            {isNewListing(listing) && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                                                    NEW
                                                </span>
                                            )}
                                        </div>

                                        {/* ── Title + description ── */}
                                        <div>
                                            <h3 className="font-semibold text-[#111418] text-base leading-snug mb-1.5 group-hover:text-[#0C6CF2] transition-colors line-clamp-2">
                                                {listing.title}
                                            </h3>
                                            <p className="text-[#8A8F83] text-xs leading-relaxed line-clamp-2">
                                                {listing.description}
                                            </p>
                                        </div>

                                        {/* ── Tags ── */}
                                        {listing.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {listing.tags
                                                    .slice(0, 3)
                                                    .map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F2EA] text-[#6B6F66] text-xs border border-[#E3DED1]"
                                                        >
                                                            <Tag className="w-2.5 h-2.5" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}

                                        {/* ── Divider ── */}
                                        <div className="border-t border-[#F0ECE6]" />

                                        {/* ── Seller + sold count ── */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#0C6CF2]/15 flex items-center justify-center text-[#0C6CF2] text-xs font-bold">
                                                    {listing.ownerName.charAt(
                                                        0,
                                                    )}
                                                </div>
                                                <span className="text-[#555] text-xs font-medium truncate max-w-[110px]">
                                                    {listing.ownerName}
                                                </span>
                                            </div>
                                            <span className="text-xs text-[#AAAAA0]">
                                                {listing.sales_count ?? 0} sold
                                            </span>
                                        </div>

                                        {/* ── Price + Buy button ── */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                {isOwner ? (
                                                    <p className="text-[#A76815] font-bold text-sm">
                                                        Your Listing
                                                    </p>
                                                ) : hasPurchased ? (
                                                    <p className="text-[#2D8A57] font-bold text-sm">
                                                        Purchased ✓
                                                    </p>
                                                ) : listing.price != null ? (
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="text-[#0C6CF2] text-xs font-bold">
                                                            ≡
                                                        </span>
                                                        <span className="text-[#0C6CF2] font-extrabold text-xl leading-none">
                                                            {listing.price.toFixed(
                                                                3,
                                                            )}
                                                        </span>
                                                        <span className="text-[#8A8F83] text-xs font-semibold">
                                                            {listing.currency}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[#6B6F66] text-sm font-semibold">
                                                        Not listed
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal(listing);
                                                }}
                                                disabled={
                                                    listing.price == null ||
                                                    isOwner ||
                                                    hasPurchased
                                                }
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                                                    isOwner
                                                        ? "border-[#F1C27D] text-[#A76815] bg-[#FFF3D6] cursor-not-allowed"
                                                        : hasPurchased
                                                          ? "border-[#BDE9C9] text-[#2D8A57] bg-[#E9F7EE] cursor-not-allowed"
                                                          : listing.price ==
                                                              null
                                                            ? "border-[#E3DED1] text-[#9AA094] bg-[#F5F2EA] cursor-not-allowed"
                                                            : "border-[#C8C0B4] text-[#111418] bg-white hover:bg-[#F5F2EA]"
                                                }`}
                                            >
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                {isOwner
                                                    ? "Listed"
                                                    : hasPurchased
                                                      ? "Owned"
                                                      : "Buy"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            {selectedListing && (
                <div
                    ref={modalRef}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-8"
                    style={{ opacity: 0 }}
                    onClick={closeModal}
                >
                    <div
                        ref={modalContentRef}
                        className="w-full max-w-lg rounded-3xl border border-[#E3DED1] bg-white overflow-hidden shadow-2xl"
                        style={{
                            fontFamily: "'DM Sans', sans-serif",
                            opacity: 0,
                            transform: "translateY(40px) scale(0.95)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-7">
                            {/* ── Owner / Purchased banners ── */}
                            {isOwnerListing(selectedListing) ? (
                                <div className="mb-5 rounded-xl bg-[#FFF3D6] border border-[#F1C27D] p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#A76815] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[#A76815] font-semibold text-sm">
                                            Your Listing
                                        </p>
                                        <p className="text-[#6B6F66] text-xs mt-1">
                                            You created this listing. You cannot
                                            purchase your own document.
                                        </p>
                                    </div>
                                </div>
                            ) : isPurchased(selectedListing.id) ? (
                                <div className="mb-5 rounded-xl bg-[#E9F7EE] border border-[#BDE9C9] p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#2D8A57] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[#2D8A57] font-semibold text-sm">
                                            Already Purchased
                                        </p>
                                        <p className="text-[#6B6F66] text-xs mt-1">
                                            You already own this document.
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            {/* ── Title + close ── */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 pr-3">
                                    <h3 className="text-xl font-bold text-[#111418] leading-snug mb-2">
                                        {selectedListing.title}
                                    </h3>
                                    {/* Category badge — matches ảnh 3 */}
                                    <span
                                        className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md border"
                                        style={{
                                            backgroundColor: getCatStyle(
                                                selectedListing.documentType,
                                            ).bg,
                                            color: getCatStyle(
                                                selectedListing.documentType,
                                            ).text,
                                            borderColor: getCatStyle(
                                                selectedListing.documentType,
                                            ).border,
                                        }}
                                    >
                                        {selectedListing.documentType.toUpperCase()}
                                    </span>
                                </div>
                                <button
                                    onClick={closeModal}
                                    disabled={isPurchasing}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E3DED1] text-[#6B6F66] hover:text-[#111418] transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ── Description ── */}
                            <p className="text-[#6B6F66] text-sm leading-relaxed mt-4 mb-5">
                                {selectedListing.description}
                            </p>

                            {/* ── 4 info boxes ── */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                {/* Seller */}
                                <div className="p-3.5 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#8A8F83] text-[10px] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                        <User className="w-3 h-3" /> Seller
                                    </p>
                                    <p className="text-[#111418] text-sm font-semibold truncate">
                                        {selectedListing.ownerName}
                                    </p>
                                    <p className="text-[#8A8F83] text-xs mt-0.5">
                                        {selectedListing.sales_count} sold
                                    </p>
                                </div>
                                {/* Token ID */}
                                <div className="p-3.5 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#8A8F83] text-[10px] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                        <Hash className="w-3 h-3" /> Token ID
                                    </p>
                                    <p className="font-mono text-[#0C6CF2] text-sm font-bold">
                                        #{selectedListing.tokenId}
                                    </p>
                                </div>
                                {/* Notarized */}
                                <div className="p-3.5 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#8A8F83] text-[10px] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                        <Calendar className="w-3 h-3" />{" "}
                                        Notarized
                                    </p>
                                    <p className="text-[#111418] text-sm font-semibold">
                                        {formatDate(selectedListing.mintDate)}
                                    </p>
                                </div>
                                {/* Verification */}
                                <div className="p-3.5 rounded-xl bg-[#F5F2EA]">
                                    <p className="text-[#8A8F83] text-[10px] uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                        <Shield className="w-3 h-3" />{" "}
                                        Verification
                                    </p>
                                    <p className="text-[#111418] text-sm font-semibold">
                                        SHA-256
                                    </p>
                                </div>
                            </div>

                            {/* ── Blockchain verified badge ── */}
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EDFAF3] border border-[#BDE9C9] mb-5">
                                <CheckCircle className="w-4 h-4 text-[#2D8A57] flex-shrink-0" />
                                <p className="text-[#2D8A57] text-xs font-medium">
                                    Verified on blockchain — immutable ownership
                                    proof
                                </p>
                                <Award className="w-4 h-4 text-[#2D8A57] ml-auto flex-shrink-0" />
                            </div>

                            {/* ── Tags ── */}
                            {selectedListing.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {selectedListing.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2.5 py-1 rounded-md bg-[#F5F2EA] text-[#6B6F66] text-xs border border-[#E3DED1] font-medium"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* ── Purchase success ── */}
                            {purchaseSuccess ? (
                                <div className="rounded-xl bg-[#E9F7EE] border border-[#BDE9C9] p-4 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-[#2D8A57] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[#2D8A57] font-semibold text-sm">
                                            Purchase Successful
                                        </p>
                                        <p className="text-[#6B6F66] text-xs mt-1">
                                            You now own this document.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* ── Price panel ── */}
                                    {!isPurchased(selectedListing.id) &&
                                        !isOwnerListing(selectedListing) && (
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F5F2EA] mb-4">
                                                <div>
                                                    <p className="text-[#8A8F83] text-xs mb-1.5">
                                                        Price
                                                    </p>
                                                    {selectedListing.price !=
                                                    null ? (
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-[#0C6CF2] text-sm font-bold">
                                                                ≡
                                                            </span>
                                                            <span className="text-[#0C6CF2] font-extrabold text-2xl leading-none">
                                                                {selectedListing.price.toFixed(
                                                                    3,
                                                                )}
                                                            </span>
                                                            <span className="text-[#8A8F83] text-sm font-normal ml-1">
                                                                {
                                                                    selectedListing.currency
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[#6B6F66] font-semibold text-sm">
                                                            Not listed
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[#8A8F83] text-xs mb-1.5">
                                                        You receive
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Download className="w-4 h-4 text-[#0C6CF2]" />
                                                        <span className="text-[#111418] text-sm font-medium">
                                                            Full file access
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* ── Errors / wallet warning ── */}
                                    {purchaseError && (
                                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                                            {purchaseError}
                                        </div>
                                    )}
                                    {!wallet.isConnected && (
                                        <div className="mb-4 p-3 rounded-xl bg-[#FFF3D6] border border-[#F1C27D] flex items-center gap-2 text-[#A76815] text-xs">
                                            <Wallet className="w-4 h-4 flex-shrink-0" />
                                            Connect your wallet to purchase this
                                            document.
                                        </div>
                                    )}

                                    {/* ── Action buttons ── */}
                                    <div className="flex gap-3 mt-1">
                                        <button
                                            onClick={closeModal}
                                            disabled={isPurchasing}
                                            className="flex-1 px-4 py-3 rounded-2xl border border-[#E3DED1] text-[#6B6F66] text-sm font-medium hover:border-[#0C6CF2]/40 hover:text-[#111418] transition-all disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handlePurchase}
                                            disabled={
                                                isPurchasing ||
                                                selectedListing.price == null ||
                                                isPurchased(
                                                    selectedListing.id,
                                                ) ||
                                                isOwnerListing(selectedListing)
                                            }
                                            className="flex-1 px-4 py-3 rounded-2xl bg-[#0C6CF2] text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isPurchasing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : isOwnerListing(
                                                  selectedListing,
                                              ) ? (
                                                "Your Listing"
                                            ) : isPurchased(
                                                  selectedListing.id,
                                              ) ? (
                                                "Owned"
                                            ) : (
                                                "Purchase"
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
