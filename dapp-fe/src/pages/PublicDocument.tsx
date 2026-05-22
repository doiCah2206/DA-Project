import { useEffect, useMemo, useState } from "react";
import {
    Calendar,
    Download,
    Eye,
    Filter,
    Globe,
    Loader2,
    Search,
    Wallet,
    CheckCircle,
} from "lucide-react";
import type { DocumentType, NotarizedDocument } from "../types";
import { useAppStore } from "../store";
import { downloadOriginalFile } from "../utils/documentDownload";
import { parseError } from "../utils/parseError";
import { CustomSelect } from "../components/ui";

type ApiRow = Record<string, unknown>;

type PublicDocumentRecord = NotarizedDocument & {
    publicAt?: Date | null;
};

const mapPublicDocument = (row: ApiRow): PublicDocumentRecord => ({
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
    mintDate: new Date(String(row.mint_date ?? Date.now())),
    transactionHash: String(row.transaction_hash ?? ""),
    ipfsCid: String(row.ipfs_cid ?? ""),
    isPublic: Boolean(row.is_public),
    publicAt: row.public_at == null ? null : new Date(String(row.public_at)),
});

const formatDate = (value: Date) =>
    new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PublicDocument = () => {
    const { token, wallet, documents, fetchDocuments, setSelectedDocument } =
        useAppStore();
    const [publicDocs, setPublicDocs] = useState<PublicDocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadId, setDownloadId] = useState<string | null>(null);
    const [receiveId, setReceiveId] = useState<string | null>(null);
    const [receiveSuccessId, setReceiveSuccessId] = useState<string | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<DocumentType | "All">("All");
    const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");

    const normalizedWallet = wallet.address?.toLowerCase() ?? "";

    useEffect(() => {
        const loadPublicDocuments = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/public-document`,
                );

                const data = await response
                    .json()
                    .catch(() => ({} as { documents?: ApiRow[] }));

                if (!response.ok) {
                    throw new Error("Unable to load public documents.");
                }

                setPublicDocs(
                    Array.isArray(data.documents)
                        ? data.documents.map(mapPublicDocument)
                        : [],
                );
            } catch (loadError) {
                const message =
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load public documents.";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void loadPublicDocuments();
    }, []);

    useEffect(() => {
        if (token && wallet.isConnected) {
            void fetchDocuments();
        }
    }, [fetchDocuments, token, wallet.isConnected]);

    const filteredDocs = useMemo(() => {
        let filtered = [...publicDocs];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (doc) =>
                    doc.title.toLowerCase().includes(query) ||
                    doc.fileName.toLowerCase().includes(query) ||
                    doc.description.toLowerCase().includes(query) ||
                    doc.tags.some((tag) => tag.toLowerCase().includes(query)),
            );
        }

        if (filterType !== "All") {
            filtered = filtered.filter((doc) => doc.documentType === filterType);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.mintDate).getTime();
            const dateB = new Date(b.mintDate).getTime();
            return sortBy === "recent" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [publicDocs, searchQuery, filterType, sortBy]);

    const documentTypes: DocumentType[] = [
        "Document",
        "Template",
        "Guide & Report",
        "Creative Asset",
        "Digital Resource",
        "Other",
    ];

    const isOwner = (doc: PublicDocumentRecord) =>
        normalizedWallet && doc.ownerAddress.toLowerCase() === normalizedWallet;

    const isAlreadyReceived = (doc: PublicDocumentRecord) =>
        Boolean(
            normalizedWallet &&
            documents.some(
                (item) =>
                    item.ownerAddress.toLowerCase() === normalizedWallet &&
                    item.fileHash.toLowerCase() === doc.fileHash.toLowerCase(),
            ),
        );

    const handleDownload = async (doc: PublicDocumentRecord) => {
        setDownloadId(doc.id);
        setError(null);
        try {
            await downloadOriginalFile(doc);
        } catch (downloadError) {
            const message = parseError(downloadError);
            setError(message);
        } finally {
            setDownloadId(null);
        }
    };

    const handleReceive = async (doc: PublicDocumentRecord) => {
        if (!token) {
            setError("Not authenticated. Please connect your wallet.");
            return;
        }

        if (!wallet.isConnected || !wallet.address) {
            setError("Please connect your wallet before receiving.");
            return;
        }

        setReceiveId(doc.id);
        setError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/${doc.id}/claim-public`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-wallet-address": wallet.address,
                    },
                },
            );

            const data = await response
                .json()
                .catch(() => ({} as { message?: string }));

            if (!response.ok) {
                throw new Error(data.message || "Unable to receive document.");
            }

            setReceiveSuccessId(doc.id);
            void fetchDocuments();
        } catch (receiveError) {
            const message = parseError(receiveError);
            setError(message);
        } finally {
            setReceiveId(null);
            setTimeout(() => setReceiveSuccessId(null), 2000);
        }
    };

    return (
        <div
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notary-dark-secondary border border-notary-cyan/20 text-notary-cyan text-xs mb-3">
                            <Globe className="w-3.5 h-3.5" />
                            Public Documents
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                            Explore Public Docs
                        </h1>
                        <p className="text-slate-400">
                            Browse documents shared publicly. Receive a copy or
                            download instantly.
                        </p>
                    </div>
                    {wallet.address ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-notary-dark-secondary border border-notary-cyan/20 text-notary-cyan text-sm">
                            <Wallet className="w-4 h-4" />
                            {wallet.address.slice(0, 6)}...
                            {wallet.address.slice(-4)}
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                        {error}
                    </div>
                ) : null}

                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search public documents..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-slate-700 placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                            />
                        </div>

                        <CustomSelect
                            value={filterType}
                            onChange={(value) =>
                                setFilterType(value as DocumentType | "All")
                            }
                            options={[
                                { label: "All Types", value: "All" },
                                ...documentTypes.map((type) => ({
                                    label: type,
                                    value: type,
                                })),
                            ]}
                            icon={<Filter className="w-5 h-5 text-slate-400" />}
                            className="w-full sm:w-48"
                        />

                        <CustomSelect
                            value={sortBy}
                            onChange={(value) =>
                                setSortBy(value as "recent" | "oldest")
                            }
                            options={[
                                { label: "Most Recent", value: "recent" },
                                { label: "Oldest First", value: "oldest" },
                            ]}
                            icon={<Calendar className="w-5 h-5 text-slate-400" />}
                            className="w-full sm:w-40"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-24 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-notary-cyan" />
                        Loading public documents...
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="notary-card rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-notary-dark-secondary flex items-center justify-center mx-auto mb-5">
                            <Globe className="w-10 h-10 text-slate-500" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-white mb-2">
                            No public documents
                        </h2>
                        <p className="text-slate-400">
                            Ask creators to make their documents public.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {filteredDocs.map((doc) => {
                            const owned = isOwner(doc);
                            const received = isAlreadyReceived(doc);
                            const isReceiving = receiveId === doc.id;
                            const receiveSuccess = receiveSuccessId === doc.id;

                            return (
                                <div
                                    key={doc.id}
                                    className="notary-card rounded-2xl p-6 flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-full bg-notary-cyan/10 text-notary-cyan text-xs border border-notary-cyan/30">
                                                    Public
                                                </span>
                                                {owned ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-notary-gold/10 text-notary-gold text-xs border border-notary-gold/30">
                                                        Your document
                                                    </span>
                                                ) : null}
                                            </div>
                                            <h3 className="font-heading text-lg font-semibold text-gray-900 mb-1">
                                                {doc.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm">
                                                {doc.documentType} • {formatDate(doc.mintDate)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedDocument(doc)}
                                            className="p-2 rounded-lg border border-notary-slate-dark text-slate-600 hover:border-notary-cyan/40 hover:text-notary-cyan transition-colors"
                                            title="Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="text-slate-500 text-sm">
                                        {doc.description ||
                                            "No description provided."}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>File: {doc.fileName}</span>
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => {
                                                void handleDownload(doc);
                                            }}
                                            disabled={downloadId === doc.id}
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-slate-700 font-semibold hover:border-notary-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {downloadId === doc.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            Download
                                        </button>
                                        <button
                                            onClick={() => {
                                                void handleReceive(doc);
                                            }}
                                            disabled={
                                                owned || received || isReceiving
                                            }
                                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {receiveSuccess ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : isReceiving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Globe className="w-4 h-4" />
                                            )}
                                            {owned
                                                ? "Owner"
                                                : received
                                                    ? "Received"
                                                    : "Receive"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicDocument;
