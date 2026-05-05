import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
    X,
    ExternalLink,
    Download,
    Share2,
    Award,
    Calendar,
    Hash,
    FileText,
    User,
    Link as LinkIcon,
    Shield,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useAppStore } from "../../store";
import {
    downloadOriginalFile,
    downloadCertificate,
    downloadEncryptedFile,
} from "../../utils/documentDownload";

const NFTDetailModal = () => {
    const { selectedDocument, setSelectedDocument, token, wallet } =
        useAppStore();
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isRequestingAccess, setIsRequestingAccess] = useState(false);
    const [requestMessage, setRequestMessage] = useState<string | null>(null);
    const [requestError, setRequestError] = useState<string | null>(null);

    if (!selectedDocument) return null;

    const activeWallet = wallet.address?.toLowerCase() ?? "";
    const ownerWallet = selectedDocument.ownerAddress?.toLowerCase() ?? "";
    const selectedDocumentStatus =
        typeof (selectedDocument as { status?: unknown }).status === "string"
            ? String(
                (selectedDocument as { status?: unknown }).status,
            ).toLowerCase()
            : null;
    const canRequestAccess = Boolean(
        token &&
        wallet.isConnected &&
        activeWallet &&
        ownerWallet &&
        activeWallet !== ownerWallet,
    );
    const showRequestAccess =
        canRequestAccess && selectedDocumentStatus !== "approved";

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleDownloadOriginalFile = async () => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            await downloadOriginalFile(selectedDocument);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Khong tai duoc file goc";
            const normalizedMessage = message.toLowerCase();
            const noAccess =
                normalizedMessage.includes("khong co quyen") ||
                normalizedMessage.includes("không có quyền") ||
                normalizedMessage.includes("khong phai vi da mint") ||
                normalizedMessage.includes("không có quyền truy cập");

            if (noAccess) {
                try {
                    await downloadEncryptedFile(selectedDocument);
                    setDownloadError(`${message} Da tai ban ma hoa (.enc).`);
                    return;
                } catch (fallbackError: unknown) {
                    const fallbackMessage =
                        fallbackError instanceof Error
                            ? fallbackError.message
                            : "Khong tai duoc file ma hoa";
                    setDownloadError(fallbackMessage);
                    console.error("Encrypted fallback error:", fallbackError);
                    return;
                }
            }

            setDownloadError(message);
            console.error("Download error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadCertificate = async () => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            downloadCertificate(selectedDocument);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Khong tai duoc certificate";
            setDownloadError(message);
            console.error("Certificate error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyFileHash = () => {
        navigator.clipboard.writeText(selectedDocument.fileHash);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRequestAccess = async () => {
        if (!token || !wallet.isConnected || !wallet.address) {
            setRequestError(
                "Vui lòng kết nối ví trước khi gửi yêu cầu truy cập.",
            );
            return;
        }

        if (wallet.address.toLowerCase() === ownerWallet) {
            setRequestError("Bạn đang mở tài liệu bằng ví chủ sở hữu.");
            return;
        }

        setIsRequestingAccess(true);
        setRequestError(null);
        setRequestMessage(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/${selectedDocument.id}/access-requests`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        "x-wallet-address": wallet.address,
                    },
                    body: JSON.stringify({
                        message: `Requesting access to ${selectedDocument.title}`,
                    }),
                },
            );

            const data = await response
                .json()
                .catch(() => ({}) as { message?: string });
            if (!response.ok) {
                throw new Error(
                    data.message || "Không gửi được yêu cầu truy cập",
                );
            }

            setRequestMessage(
                data.message || "Đã gửi yêu cầu truy cập thành công.",
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Không gửi được yêu cầu truy cập";
            setRequestError(message);
        } finally {
            setIsRequestingAccess(false);
        }
    };

    return (
        <Transition appear show={!!selectedDocument} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-50"
                onClose={() => setSelectedDocument(null)}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-notary-dark border border-notary-cyan/20 shadow-2xl transition-all">
                                {/* Header with Certificate Stamp */}
                                <div className="relative">
                                    {/* Background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-notary-cyan/5 to-purple-500/5"></div>

                                    {/* Stamp overlay */}
                                    <div className="absolute top-4 right-4 w-24 h-24 opacity-20">
                                        <svg
                                            viewBox="0 0 100 100"
                                            className="w-full h-full"
                                        >
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="45"
                                                fill="none"
                                                stroke="#F5C842"
                                                strokeWidth="3"
                                                strokeDasharray="5,5"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="35"
                                                fill="none"
                                                stroke="#F5C842"
                                                strokeWidth="2"
                                            />
                                            <text
                                                x="50"
                                                y="55"
                                                textAnchor="middle"
                                                fill="#F5C842"
                                                fontSize="12"
                                                fontWeight="bold"
                                            >
                                                VERIFIED
                                            </text>
                                        </svg>
                                    </div>

                                    <div className="relative p-6 pb-4">
                                        {/* Close button */}
                                        <button
                                            onClick={() =>
                                                setSelectedDocument(null)
                                            }
                                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-600 hover:text-gray-900 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        {/* Title and Badge */}
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-notary-cyan/20 to-purple-500/20 flex items-center justify-center">
                                                <Shield className="w-7 h-7 text-notary-cyan" />
                                            </div>
                                            <div>
                                                <h2 className="font-heading text-2xl font-bold text-gray-900">
                                                    {selectedDocument.title}
                                                </h2>
                                                <span className="inline-block px-3 py-1 rounded-full bg-notary-success/10 text-notary-success text-sm font-medium">
                                                    ✓ Verified on Blockchain
                                                </span>
                                            </div>
                                        </div>

                                        {/* Token ID */}
                                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-notary-cyan/10 border border-notary-cyan/20">
                                            <Award className="w-5 h-5 text-notary-cyan mr-2" />
                                            <span className="font-mono text-notary-cyan font-bold">
                                                Token ID #
                                                {selectedDocument.tokenId}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    {/* Main info grid */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <User className="w-3 h-3 mr-1" />
                                                Owner
                                            </span>
                                            <p className="text-gray-900 font-medium">
                                                {selectedDocument.ownerName}
                                            </p>
                                            <p className="font-mono text-xs text-notary-cyan mt-1">
                                                {selectedDocument.ownerAddress.slice(
                                                    0,
                                                    10,
                                                )}
                                                ...
                                                {selectedDocument.ownerAddress.slice(
                                                    -8,
                                                )}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Mint Date
                                            </span>
                                            <p className="text-gray-900 font-medium">
                                                {formatDate(
                                                    selectedDocument.mintDate,
                                                )}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <FileText className="w-3 h-3 mr-1" />
                                                Document Type
                                            </span>
                                            <p className="text-gray-900 font-medium">
                                                {selectedDocument.documentType}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <FileText className="w-3 h-3 mr-1" />
                                                File Name
                                            </span>
                                            <p className="text-gray-900 font-medium truncate">
                                                {selectedDocument.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedDocument.description && (
                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs block mb-2">
                                                Description
                                            </span>
                                            <p className="text-slate-700">
                                                {selectedDocument.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* File Hash */}
                                    <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            <Hash className="w-3 h-3 mr-1" />
                                            File Hash (SHA-256)
                                        </span>
                                        <p className="font-mono text-xs text-notary-cyan break-all">
                                            {selectedDocument.fileHash}
                                        </p>
                                    </div>

                                    {/* Transaction Hash */}
                                    <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            Transaction Hash
                                        </span>
                                        <p className="font-mono text-xs text-slate-600 break-all">
                                            {selectedDocument.transactionHash}
                                        </p>
                                    </div>

                                    {/* IPFS URI */}
                                    <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            <LinkIcon className="w-3 h-3 mr-1" />
                                            IPFS Metadata URI
                                        </span>
                                        <p className="font-mono text-xs text-slate-600 break-all">
                                            {selectedDocument.ipfsUri}
                                        </p>
                                    </div>

                                    {showRequestAccess ? (
                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30 space-y-2">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <span className="text-slate-500 text-xs block mb-2">
                                                        Request Access
                                                    </span>
                                                    <p className="text-slate-300 text-sm">
                                                        Ask the owner to approve
                                                        access to the original
                                                        file.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={
                                                        handleRequestAccess
                                                    }
                                                    disabled={
                                                        isRequestingAccess
                                                    }
                                                    className="px-4 py-2 rounded-xl bg-notary-cyan/10 border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {isRequestingAccess
                                                        ? "Sending..."
                                                        : "Request Access"}
                                                </button>
                                            </div>
                                            {requestMessage ? (
                                                <p className="text-xs text-notary-success">
                                                    {requestMessage}
                                                </p>
                                            ) : null}
                                            {requestError ? (
                                                <p className="text-xs text-red-400">
                                                    {requestError}
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {/* Tags */}
                                    {selectedDocument.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDocument.tags.map(
                                                (tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 rounded-full bg-notary-dark-secondary border border-notary-slate-dark text-slate-400 text-xs"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-6 pt-0 space-y-3">
                                    {/* Error Alert */}
                                    {downloadError && (
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-400 text-sm font-medium">
                                                    Download Error
                                                </p>
                                                <p className="text-red-300 text-xs mt-1">
                                                    {downloadError}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={handleDownloadOriginalFile}
                                            disabled={isDownloading}
                                            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-notary-gold text-notary-dark font-semibold hover:bg-notary-gold-dim disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            title="Tai file goc tu IPFS (giai ma)"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Dang tai...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    <span>Download File</span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleDownloadCertificate}
                                            disabled={isDownloading}
                                            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-notary-cyan/10 border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            title="Tai certificate notarize (text file)"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span>Dang tai...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    <span>
                                                        Download Certificate
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Share and External Link */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCopyFileHash}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/10 transition-all"
                                            title="Copy transaction file hash"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            <span>
                                                {copied
                                                    ? "Copied!"
                                                    : "Copy Hash"}
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                alert("Coming soon!")
                                            }
                                            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-notary-slate-dark text-slate-600 font-semibold hover:border-notary-cyan/50 hover:text-gray-900 transition-all"
                                            title="Xem tren blockchain explorer"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default NFTDetailModal;
