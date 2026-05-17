import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    FileText,
    Copy,
    Check,
    ChevronRight,
    ChevronLeft,
    Loader2,
    AlertCircle,
    X,
    Sparkles,
    GitBranch,
} from "lucide-react";
import { useAppStore } from "../store";
import type {
    NotarizeStep,
    DocumentType,
    NotarizeFormData,
    MintingStatus,
    NotarizedDocument,
} from "../types";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";
import { parseError } from "../utils/parseError";

type VersionMode = "new" | "existing";

const getVersionGroupKey = (doc: NotarizedDocument): string => {
    const title = doc.title.trim().toLowerCase();
    const owner = doc.ownerAddress.trim().toLowerCase();
    return `${title}::${owner}`;
};

const isUserRejectedError = (err: unknown): boolean => {
    if (!err || typeof err !== "object") return false;
    const error = err as { code?: number; message?: string };
    if (error.code === 4001) return true;
    const message = error.message?.toLowerCase() ?? "";
    return (
        message.includes("user rejected") ||
        message.includes("denied") ||
        message.includes("cancel")
    );
};

const Notarize = () => {
    const navigate = useNavigate();
    const { wallet, addDocument, documents, fetchDocuments } = useAppStore();
    const [step, setStep] = useState<NotarizeStep>(1);
    const [versionMode, setVersionMode] = useState<VersionMode>("new");
    const [selectedBaseDocumentId, setSelectedBaseDocumentId] = useState<
        string | null
    >(null);
    const [formData, setFormData] = useState<NotarizeFormData>({
        file: null,
        fileHash: "",
        title: "",
        documentType: "Document",
        description: "",
        ownerName: "",
        tags: [],
    });
    const [tagsInput, setTagsInput] = useState("");
    const [mintingStatus, setMintingStatus] = useState<MintingStatus>("idle");
    const [mintingStep, setMintingStep] = useState("");
    const [copied, setCopied] = useState(false);
    const [mintedDoc, setMintedDoc] = useState<NotarizedDocument | null>(null);
    const [uiNotice, setUiNotice] = useState<
        { type: "info" | "error" | "success"; message: string } | null
    >(null);
    const uiNoticeTimerRef = useRef<number | null>(null);

    const showUiNotice = useCallback(
        (type: "info" | "error" | "success", message: string) => {
            setUiNotice({ type, message });
            if (uiNoticeTimerRef.current) {
                window.clearTimeout(uiNoticeTimerRef.current);
            }
            uiNoticeTimerRef.current = window.setTimeout(() => {
                setUiNotice(null);
                uiNoticeTimerRef.current = null;
            }, 3500);
        },
        [],
    );

    const versionGroups = useMemo(() => {
        const map = new Map<
            string,
            { latest: NotarizedDocument; versions: NotarizedDocument[] }
        >();

        documents.forEach((doc) => {
            const key = getVersionGroupKey(doc);
            const existing = map.get(key);
            if (!existing) {
                map.set(key, { latest: doc, versions: [doc] });
                return;
            }

            existing.versions.push(doc);
            if (
                new Date(doc.mintDate).getTime() >
                new Date(existing.latest.mintDate).getTime()
            ) {
                existing.latest = doc;
            }
            map.set(key, existing);
        });

        return Array.from(map.values()).sort(
            (a, b) =>
                new Date(b.latest.mintDate).getTime() -
                new Date(a.latest.mintDate).getTime(),
        );
    }, [documents]);

    const selectedGroup = useMemo(
        () =>
            versionGroups.find(
                (group) => group.latest.id === selectedBaseDocumentId,
            ) ?? null,
        [versionGroups, selectedBaseDocumentId],
    );

    const normalizedWalletAddress = wallet.address?.trim().toLowerCase() ?? "";
    const normalizedTitle = formData.title.trim().toLowerCase();
    const duplicateTitleExists =
        versionMode === "new" && normalizedTitle.length > 0
            ? documents.some(
                (doc) => doc.title.trim().toLowerCase() === normalizedTitle,
            )
            : false;
    const duplicateFileExists = Boolean(
        formData.fileHash &&
        normalizedWalletAddress &&
        documents.some(
            (doc) =>
                doc.fileHash.trim().toLowerCase() ===
                formData.fileHash.trim().toLowerCase() &&
                doc.ownerAddress.trim().toLowerCase() ===
                normalizedWalletAddress,
        ),
    );

    const nextVersionNumber =
        versionMode === "existing" && selectedGroup
            ? selectedGroup.versions.length + 1
            : 1;

    const computeHash = useCallback(async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    }, []);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (file) {
                void computeHash(file).then((hash) => {
                    setFormData((prev) => ({ ...prev, file, fileHash: hash }));
                });
            }
        },
        [computeHash],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        maxFiles: 1,
        onDragEnter: () => { },
        onDragOver: () => { },
        onDragLeave: () => { },
    });

    const dropzoneInputProps = getInputProps();
    delete (dropzoneInputProps as { refKey?: string }).refKey;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.includes("pdf")) return "PDF";
        if (type.includes("image")) return "IMG";
        if (type.includes("doc")) return "DOC";
        return "FILE";
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSelectBaseDocument = (doc: NotarizedDocument) => {
        setSelectedBaseDocumentId(doc.id);
        setFormData((prev) => ({
            ...prev,
            title: doc.title,
            documentType: doc.documentType,
            description: doc.description,
            ownerName: doc.ownerName,
            tags: doc.tags,
        }));
        setTagsInput(doc.tags.join(", "));
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                if (versionMode === "new") return true;
                return selectedBaseDocumentId !== null;
            case 2:
                return formData.file !== null && !duplicateFileExists;
            case 3:
                return (
                    Boolean(formData.title && formData.ownerName) &&
                    !duplicateTitleExists &&
                    !duplicateFileExists
                );
            case 4:
                return true;
            default:
                return false;
        }
    };

    const handleMint = async () => {
        if (!wallet.isConnected || !formData.file) return;
        if (duplicateFileExists) {
            alert(
                "This file already exists for the current wallet. Please choose a different file or use the existing version if appropriate.",
            );
            return;
        }
        if (duplicateTitleExists) {
            alert(
                "The document title already exists. Please rename it or choose Add New Version if this is a new version.",
            );
            return;
        }
        const token = useAppStore.getState().token;
        if (!token) {
            alert("Not authenticated. Please reconnect your wallet.");
            return;
        }
        if (!CONTRACT_ADDRESS) {
            alert("Missing CONTRACT_ADDRESS in dapp-fe/.env");
            return;
        }

        setMintingStatus("preparing");
        setMintingStep("Encrypting file...");

        try {
            const fileBuffer = await formData.file.arrayBuffer();
            const aesKey = await crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"],
            );
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                aesKey,
                fileBuffer,
            );
            const rawKey = await crypto.subtle.exportKey("raw", aesKey);
            const aesKeyBase64 = btoa(
                String.fromCharCode(...new Uint8Array(rawKey)),
            );
            const ivBase64 = btoa(String.fromCharCode(...iv));

            setMintingStatus("uploading");
            setMintingStep("Uploading to IPFS (Pinata)...");
            const encryptedBlob = new Blob([encryptedBuffer], {
                type: "application/octet-stream",
            });
            const pinataForm = new FormData();
            pinataForm.append(
                "file",
                encryptedBlob,
                `${formData.file.name}.enc`,
            );
            const pinataRes = await fetch(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
                    },
                    body: pinataForm,
                },
            );
            if (!pinataRes.ok) {
                const pinataError = await pinataRes.text().catch(() => "");
                throw new Error(
                    `Pinata upload failed (${pinataRes.status}): ${pinataError || "no response"}`,
                );
            }
            const pinataData = await pinataRes.json();
            const ipfsCid: string = pinataData.IpfsHash;

            setMintingStatus("minting");
            setMintingStep("Minting NFT on the blockchain...");
            const { BrowserProvider, Contract } = await import("ethers");
            if (!window.ethereum) throw new Error("Web3 wallet not found");
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
                        "Please switch to the Oasis Sapphire Testnet before minting",
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
            const hashBytes32 = formData.fileHash.startsWith("0x")
                ? formData.fileHash
                : `0x${formData.fileHash}`;
            const tx = await contract.issueCertificate(
                hashBytes32,
                ipfsCid,
                formData.title,
                formData.description,
            );
            const receipt = await tx.wait();
            const txHash: string = receipt.hash;
            const tokenId = String(Math.floor(Math.random() * 10000) + 1000);

            const API =
                import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
            const mintRes = await fetch(`${API}/documents/mint`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tokenId,
                    fileHash: formData.fileHash,
                    fileName: formData.file.name,
                    fileSize: formData.file.size,
                    fileType: formData.file.type,
                    title: formData.title,
                    documentType: formData.documentType,
                    description: formData.description,
                    ownerName: formData.ownerName,
                    ownerAddress: wallet.address,
                    tags: formData.tags,
                    transactionHash: txHash,
                    ipfsUri: `ipfs://${ipfsCid}`,
                    ipfsCid,
                    decryptionKeyPayload: { key: aesKeyBase64, iv: ivBase64 },
                }),
            });
            const mintData = await mintRes.json();
            if (!mintRes.ok)
                throw new Error(
                    mintData.message ||
                    `Failed to save metadata (${mintRes.status})`,
                );

            await fetch(`${API}/documents/${mintData.document.id}/ipfs-cid`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ipfs_cid: ipfsCid }),
            });

            const newDoc: NotarizedDocument = {
                id: String(mintData.document.id),
                tokenId,
                fileHash: formData.fileHash,
                fileName: formData.file.name,
                fileSize: formData.file.size,
                fileType: formData.file.type,
                title: formData.title,
                documentType: formData.documentType,
                description: formData.description,
                ownerName: formData.ownerName,
                ownerAddress: wallet.address!,
                tags: formData.tags,
                mintDate: new Date(),
                transactionHash: txHash,
                ipfsUri: `ipfs://${ipfsCid}`,
                ipfsCid,
            };

            setMintedDoc(newDoc);
            addDocument(newDoc);
            setMintingStatus("success");
        } catch (err: unknown) {
            if (isUserRejectedError(err)) {
                showUiNotice("info", "Mint transaction cancelled");
            } else {
                alert(`Mint failed: ${parseError(err)}`);
            }
            setMintingStatus("idle");
            setMintingStep("");
        }
    };

    const documentTypes: DocumentType[] = [
        "Document",
        "Template",
        "Guide & Report",
        "Creative Asset",
        "Digital Resource",
        "Other",
    ];

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3, 4].map((s, index) => (
                <div key={s} className="flex items-center">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-heading font-bold transition-all ${step >= s
                            ? "bg-notary-cyan border-notary-cyan text-notary-dark"
                            : "border-slate-600 text-slate-500"
                            }`}
                    >
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {index < 3 && (
                        <div
                            className={`w-12 sm:w-20 h-0.5 mx-2 transition-all ${step > s ? "bg-notary-cyan" : "bg-slate-700"}`}
                        ></div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                    Choose Type
                </h2>
                {/* <p className="text-slate-400">
                    Tao document moi hoac them phien ban cho document da co
                </p> */}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <button
                    onClick={() => {
                        setVersionMode("new");
                        setSelectedBaseDocumentId(null);
                    }}
                    className={`text-left p-5 rounded-2xl border transition-all ${versionMode === "new"
                        ? "border-notary-cyan bg-notary-cyan/10"
                        : "border-notary-slate-dark bg-notary-dark-secondary/40 hover:border-notary-cyan/40"
                        }`}
                >
                    <div className="flex items-center mb-3">
                        <FileText className="w-5 h-5 mr-2 text-notary-cyan" />
                        <h3 className="font-heading text-gray-900 font-semibold">
                            New Document
                        </h3>
                    </div>
                    <p className="text-slate-600 text-sm">
                        Create a new document, starting with version V1
                    </p>
                </button>

                <button
                    onClick={() => setVersionMode("existing")}
                    className={`text-left p-5 rounded-2xl border transition-all ${versionMode === "existing"
                        ? "border-notary-cyan bg-notary-cyan/10"
                        : "border-notary-slate-dark bg-notary-dark-secondary/40 hover:border-notary-cyan/40"
                        }`}
                >
                    <div className="flex items-center mb-3">
                        <GitBranch className="w-5 h-5 mr-2 text-notary-cyan" />
                        <h3 className="font-heading text-gray-900 font-semibold">
                            Add New Version
                        </h3>
                    </div>
                    <p className="text-slate-600 text-sm">
                        Select the old document and add a new version to it
                    </p>
                </button>
            </div>

            {versionMode === "existing" ? (
                <div className="space-y-3">
                    <h4 className="text-slate-600 font-semibold">
                        Choose Document
                    </h4>

                    {versionGroups.length === 0 ? (
                        <div className="rounded-xl border border-notary-slate-dark bg-notary-dark-secondary/40 p-4 text-slate-400 text-sm">
                            You do not have any documents in My Documents to
                            add a version.
                        </div>
                    ) : (
                        <div className="max-h-72 overflow-auto space-y-2 pr-1">
                            {versionGroups.map(({ latest, versions }) => (
                                <button
                                    key={latest.id}
                                    onClick={() =>
                                        handleSelectBaseDocument(latest)
                                    }
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedBaseDocumentId === latest.id
                                        ? "border-notary-cyan bg-notary-cyan/10"
                                        : "border-notary-slate-dark bg-notary-dark-secondary/40 hover:border-notary-cyan/40"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-gray-900 font-medium">
                                            {latest.title}
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded-full bg-notary-dark text-notary-cyan">
                                            {versions.length} version(s)
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        Owner: {latest.ownerName}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                    Upload File
                </h2>
                <p className="text-slate-400">
                    Upload file for{" "}
                    {versionMode === "existing"
                        ? `Version ${nextVersionNumber}`
                        : "a new document"}
                </p>
            </div>

            {!formData.file ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                        ? "border-notary-cyan bg-notary-cyan/5"
                        : "border-slate-700 hover:border-notary-cyan/50 hover:bg-notary-dark-secondary/50"
                        }`}
                >
                    <input {...dropzoneInputProps} />
                    <div className="w-20 h-20 rounded-full bg-notary-cyan/10 flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-notary-cyan" />
                    </div>
                    <p className="text-gray-900 font-medium text-lg mb-2">
                        {isDragActive
                            ? "Drop your file here"
                            : "Drag & drop your file here"}
                    </p>
                    <p className="text-slate-500">or click to browse</p>
                </div>
            ) : (
                <div className="notary-card rounded-2xl p-6 animate-slide-up">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-sm font-semibold text-notary-cyan">
                                {getFileIcon(formData.file.type)}
                            </div>
                            <div>
                                <h3 className="font-heading font-semibold text-gray-900 text-lg">
                                    {formData.file.name}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {formatFileSize(formData.file.size)} •{" "}
                                    {formData.file.type || "Unknown type"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    file: null,
                                    fileHash: "",
                                }))
                            }
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-notary-dark rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">
                                SHA-256 Hash
                            </span>
                            <button
                                onClick={() =>
                                    copyToClipboard(formData.fileHash)
                                }
                                className="flex items-center space-x-1 text-notary-cyan text-sm hover:text-notary-cyan/80 transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                <span>{copied ? "Copied!" : "Copy"}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-500 break-all">
                            {formData.fileHash}
                        </p>
                    </div>

                    {duplicateFileExists ? (
                        <p className="mt-3 text-sm text-red-400">
                            File hash already exists for this wallet address.
                            Please upload a different file.
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                    Fill Metadata
                </h2>
                <p className="text-slate-400">
                    Update document information before minting
                </p>
            </div>

            <div className="grid gap-6">
                <div>
                    <label className="block text-slate-400 text-sm mb-2">
                        Document Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                title: e.target.value,
                            }))
                        }
                        disabled={versionMode === "existing"}
                        placeholder="e.g., Employment Contract - John Doe"
                        aria-invalid={duplicateTitleExists}
                        className={`w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border text-slate-700 placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all disabled:cursor-not-allowed disabled:opacity-70 ${duplicateTitleExists ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20" : "border-notary-slate-dark"}`}
                    />
                    {duplicateTitleExists ? (
                        <p className="mt-2 text-xs text-red-400">
                            Title already exists. Please use a different title
                            for a new document, or choose Add New Version.
                        </p>
                    ) : null}
                    {versionMode === "existing" ? (
                        <p className="mt-2 text-xs text-slate-500">
                            Title is inherited from the selected base document.
                        </p>
                    ) : null}
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">
                        Document Type *
                    </label>
                    <select
                        value={formData.documentType}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                documentType: e.target.value as DocumentType,
                            }))
                        }
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    >
                        {documentTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                        placeholder="Brief description of the document..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-gray-700 placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">
                        Owner Name *
                    </label>
                    <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                ownerName: e.target.value,
                            }))
                        }
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-slate-950 placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => {
                            setTagsInput(e.target.value);
                            const tags = e.target.value
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean);
                            setFormData((prev) => ({ ...prev, tags }));
                        }}
                        placeholder="e.g., contract, legal, important"
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-slate-700 placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => {
        if (mintedDoc) {
            return (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-notary-success/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Sparkles className="w-12 h-12 text-notary-success" />
                    </div>

                    <h2 className="font-heading text-3xl font-bold text-gray-900 mb-4">
                        Successfully Notarized!
                    </h2>

                    <p className="text-slate-400 mb-8">
                        {versionMode === "existing"
                            ? `Created Version ${nextVersionNumber}`
                            : "Created Version 1"}{" "}
                        for the document.
                    </p>

                    <div className="notary-card rounded-2xl p-6 text-left mb-8">
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                                <span className="text-slate-400">Token ID</span>
                                <span className="font-mono text-notary-cyan">
                                    #{mintedDoc.tokenId}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                                <span className="text-slate-400">
                                    Transaction
                                </span>
                                <span className="font-mono text-xs text-slate-500">
                                    {mintedDoc.transactionHash.slice(0, 20)}...
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-slate-400">IPFS URI</span>
                                <span className="font-mono text-xs text-slate-500">
                                    {mintedDoc.ipfsUri.slice(0, 20)}...
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => {
                                setStep(1);
                                setVersionMode("new");
                                setSelectedBaseDocumentId(null);
                                setFormData({
                                    file: null,
                                    fileHash: "",
                                    title: "",
                                    documentType: 'Document',
                                    description: "",
                                    ownerName: "",
                                    tags: [],
                                });
                                setTagsInput("");
                                setMintingStatus("idle");
                                setMintedDoc(null);
                            }}
                            className="px-6 py-3 rounded-xl border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/10 transition-all"
                        >
                            Notarize Another
                        </button>
                        <button
                            onClick={() => navigate("/documents")}
                            className="px-6 py-3 rounded-xl bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim transition-all glow-cyan-hover"
                        >
                            View My Documents
                        </button>
                    </div>
                </div>
            );
        }

        if (mintingStatus !== "idle") {
            return (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-notary-cyan/10 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-12 h-12 text-notary-cyan animate-spin" />
                    </div>

                    <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">
                        Minting Your NFT
                    </h2>

                    <p className="text-notary-cyan mb-8 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {mintingStep}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                        Review & Mint
                    </h2>
                    <p className="text-slate-400">
                        Confirm details before creating your notarization NFT
                    </p>
                </div>

                <div className="notary-card rounded-2xl p-6">
                    <h3 className="font-heading text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-notary-cyan" />
                        Notarization Summary
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Mode</span>
                            <span className="text-gray-900">
                                {versionMode === "existing"
                                    ? "Add Version"
                                    : "New Document"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Version</span>
                            <span className="text-gray-900">
                                V{nextVersionNumber}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Document</span>
                            <span className="text-gray-900">
                                {formData.file?.name}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Title</span>
                            <span className="text-gray-900">
                                {formData.title}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Type</span>
                            <span className="text-gray-900">
                                {formData.documentType}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-600">Owner</span>
                            <span className="text-gray-900">
                                {formData.ownerName}
                            </span>
                        </div>
                        <div className="py-2">
                            <span className="text-slate-600 block mb-2">
                                File Hash
                            </span>
                            <p className="font-mono text-xs text-notary-cyan break-all bg-notary-dark p-3 rounded-lg">
                                {formData.fileHash}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-notary-gold/10 border border-notary-gold/30">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-notary-gold mr-3" />
                        <span className="text-slate-950">
                            Estimated Gas Fee
                        </span>
                    </div>
                    <span className="font-mono text-notary-gold font-semibold">
                        ~0.003 TEST
                    </span>
                </div>

                <button
                    onClick={handleMint}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-notary-cyan to-purple-500 text-notary-dark font-heading font-bold text-lg hover:opacity-90 transition-all glow-cyan-hover"
                >
                    Mint Notarization NFT
                </button>
            </div>
        );
    };

    useEffect(() => {
        if (!wallet.isConnected) {
            navigate("/");
            return;
        }
        void fetchDocuments();
    }, [wallet.isConnected, navigate, fetchDocuments]);

    if (!wallet.isConnected) {
        return null;
    }

    const showNavigation = !(
        step === 4 &&
        (mintingStatus !== "idle" || mintedDoc)
    );

    return (
        <div
            className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <div className="max-w-3xl mx-auto">
                {uiNotice ? (
                    <div className="fixed top-20 right-5 z-50">
                        <div
                            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${uiNotice.type === "success"
                                ? "border-notary-success/40 bg-notary-success/15 text-notary-success"
                                : uiNotice.type === "error"
                                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                                    : "border-notary-cyan/40 bg-notary-cyan/10 text-notary-cyan"
                                }`}
                        >
                            <span className="text-sm font-medium">
                                {uiNotice.message}
                            </span>
                            <button
                                onClick={() => setUiNotice(null)}
                                className="ml-2 text-inherit/70 hover:text-inherit"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : null}
                {renderStepIndicator()}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}

                {showNavigation ? (
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() =>
                                step > 1 && setStep((step - 1) as NotarizeStep)
                            }
                            disabled={step === 1}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${step === 1
                                ? "text-slate-600 cursor-not-allowed"
                                : "text-gray-600 hover:bg-notary-dark-secondary"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>

                        <button
                            onClick={() =>
                                step < 4 && setStep((step + 1) as NotarizeStep)
                            }
                            disabled={!canProceed() || step === 4}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${!canProceed() || step === 4
                                ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                                : "bg-notary-cyan text-notary-dark hover:bg-notary-cyan-dim glow-cyan-hover"
                                }`}
                        >
                            <span>Next</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Notarize;
