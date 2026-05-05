import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, Loader2, ShieldCheck, User, Wallet } from 'lucide-react';
import { useAppStore } from '../store';
import type { NotarizedDocument } from '../types';
import { downloadOriginalFile } from '../utils/documentDownload';

type SharedDocumentRecord = NotarizedDocument & {
    request_id: string;
    request_message: string | null;
    requested_at: string;
    resolved_at: string | null;
    status: 'approved' | 'pending' | 'rejected' | string;
};

type SharedDocumentApiRow = Record<string, unknown> & {
    request_id?: unknown;
    request_message?: unknown;
    requested_at?: unknown;
    resolved_at?: unknown;
    status?: unknown;
};

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const mapSharedDocument = (row: SharedDocumentApiRow): SharedDocumentRecord => ({
    id: String(row.id),
    tokenId: String(row.token_id ?? ''),
    fileHash: String(row.file_hash ?? ''),
    fileName: String(row.file_name ?? ''),
    fileSize: Number(row.file_size ?? 0),
    fileType: String(row.file_type ?? ''),
    title: String(row.title ?? ''),
    documentType: (row.document_type ?? 'Other') as NotarizedDocument['documentType'],
    description: String(row.description ?? ''),
    ownerName: String(row.owner_name ?? ''),
    ownerAddress: String(row.owner_address ?? ''),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    mintDate: new Date(String(row.mint_date ?? row.created_at ?? Date.now())),
    transactionHash: String(row.transaction_hash ?? ''),
    ipfsUri: String(row.ipfs_uri ?? ''),
    ipfsCid: String(row.ipfs_cid ?? ''),
    request_id: String(row.request_id ?? ''),
    request_message: row.request_message == null ? null : String(row.request_message),
    requested_at: String(row.requested_at ?? row.created_at ?? Date.now()),
    resolved_at: row.resolved_at == null ? null : String(row.resolved_at),
    status: String(row.status ?? 'approved'),
});

const SharedDocuments = () => {
    const { token, wallet, setSelectedDocument } = useAppStore();
    const [documents, setDocuments] = useState<SharedDocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadId, setDownloadId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSharedDocuments = async () => {
            if (!token || !wallet.isConnected || !wallet.address) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}/documents/shared-documents`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-wallet-address': wallet.address,
                    },
                });

                const data = await response.json().catch(() => ({} as { message?: string; documents?: SharedDocumentRecord[] }));
                if (!response.ok) {
                    throw new Error(data.message || 'Không tải được shared documents');
                }

                setDocuments((data.documents ?? []).map(mapSharedDocument));
            } catch (loadError) {
                const message = loadError instanceof Error ? loadError.message : 'Không tải được shared documents';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void loadSharedDocuments();
    }, [token, wallet.address, wallet.isConnected]);

    const handleDownload = async (document: SharedDocumentRecord) => {
        setDownloadId(document.id);
        setError(null);
        try {
            await downloadOriginalFile(document);
        } catch (downloadError) {
            const message = downloadError instanceof Error ? downloadError.message : 'Không tải được file gốc';
            setError(message);
        } finally {
            setDownloadId(null);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-[#121317] mb-6">Shared Documents</h1>
                        <p className="text-slate-400">Documents that owners have approved for your wallet.</p>
                    </div>
                    {wallet.address ? (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-notary-dark-secondary border border-notary-cyan/20 text-notary-cyan text-sm">
                            <Wallet className="w-4 h-4" />
                            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </div>
                    ) : null}
                </div>

                {error ? (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="py-20 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-notary-cyan" />
                        Loading approved documents...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="notary-card rounded-2xl p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-notary-dark-secondary flex items-center justify-center mx-auto mb-5">
                            <ShieldCheck className="w-10 h-10 text-slate-500" />
                        </div>
                        <h2 className="font-heading text-xl font-semibold text-white mb-2">No shared documents yet</h2>
                        <p className="text-slate-400">When an owner approves your request, the document will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {documents.map((document) => (
                            <div key={`${document.request_id}-${document.id}`} className="notary-card rounded-2xl p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-notary-cyan">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-heading text-lg font-semibold text-slate-800">{document.title}</h3>
                                                <span className="px-2 py-0.5 rounded-full bg-notary-success/15 text-notary-success text-xs border border-notary-success/30">
                                                    Approved
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-1">Owner: {document.ownerName}</p>
                                            <p className="text-slate-500 text-xs mb-3 break-all">{document.request_message || 'Access approved by owner.'}</p>
                                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                                <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {document.documentType}</span>
                                                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Requested {formatDate(document.requested_at)}</span>
                                                {document.resolved_at ? (
                                                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Approved {formatDate(document.resolved_at)}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => setSelectedDocument(document)}
                                            className="px-4 py-2 rounded-xl bg-notary-cyan/10 border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/20 transition-all"
                                        >
                                            Open
                                        </button>
                                        <button
                                            onClick={() => { void handleDownload(document); }}
                                            disabled={downloadId === document.id}
                                            className="px-4 py-2 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white font-semibold hover:border-notary-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                                        >
                                            {downloadId === document.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedDocuments;