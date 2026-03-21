import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
    Search, Upload, FileText, CheckCircle, XCircle, Loader2,
    Calendar, Hash, Award, ExternalLink, User
} from 'lucide-react';
import { useAppStore } from '../store';
import type { NotarizedDocument } from '../types';

const Verify = () => {
    const { documents } = useAppStore();
    const [file, setFile] = useState<File | null>(null);
    const [fileHash, setFileHash] = useState('');
    const [manualHash, setManualHash] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<{ found: boolean; document?: NotarizedDocument } | null>(null);

    // Compute SHA-256 hash
    const computeHash = useCallback(async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            void computeHash(uploadedFile).then((hash) => {
                setFileHash(hash);
            });
        }
    }, [computeHash]);

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

    const handleVerify = async (hash?: string) => {
        const hashToVerify = hash || fileHash || manualHash;
        if (!hashToVerify) return;

        setIsVerifying(true);
        setResult(null);

        // Simulate blockchain lookup delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Search in documents (including mock demo hashes)
        const found = documents.find(doc => doc.fileHash === hashToVerify);

        setResult({
            found: !!found,
            document: found,
        });
        setIsVerifying(false);
    };

    const handleManualVerify = () => {
        if (manualHash) {
            handleVerify(manualHash);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const truncateHash = (hash: string, start = 10, end = 8) => {
        return `${hash.slice(0, start)}...${hash.slice(-end)}`;
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
                        Verify File Notarization
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Upload a file or paste a hash to verify its blockchain record
                    </p>
                </div>

                {/* Upload Section */}
                <div className="mb-8">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive
                            ? 'border-notary-cyan bg-notary-cyan/5'
                            : 'border-slate-700 hover:border-notary-cyan/50 hover:bg-notary-dark-secondary/50'
                            }`}
                    >
                        <input {...dropzoneInputProps} />
                        <div className="w-16 h-16 rounded-full bg-notary-cyan/10 flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-notary-cyan" />
                        </div>
                        <p className="text-white font-medium mb-2">
                            {isDragActive ? 'Drop your file here' : 'Drag & drop a file to verify'}
                        </p>
                        <p className="text-slate-500 text-sm">
                            or click to browse • SHA-256 hash will be computed automatically
                        </p>
                    </div>

                    {/* File info and hash */}
                    {file && (
                        <div className="mt-6 p-6 rounded-2xl notary-card animate-slide-up">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-2xl">
                                        {file.type.includes('pdf') ? '📄' : file.type.includes('image') ? '🖼️' : '📎'}
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-semibold text-white">
                                            {file.name}
                                        </h3>
                                        <p className="text-slate-400 text-sm">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setFileHash('');
                                        setResult(null);
                                    }}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-notary-dark">
                                <span className="text-slate-500 text-sm flex items-center mb-2">
                                    <Hash className="w-4 h-4 mr-1" />
                                    SHA-256 Hash
                                </span>
                                <p className="font-mono text-xs text-notary-cyan break-all">
                                    {fileHash}
                                </p>
                            </div>

                            <button
                                onClick={() => handleVerify()}
                                disabled={isVerifying || !fileHash}
                                className={`mt-4 w-full py-4 rounded-xl font-heading font-bold text-lg transition-all ${isVerifying || !fileHash
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-notary-cyan text-notary-dark hover:bg-notary-cyan-dim glow-cyan-hover'
                                    }`}
                            >
                                {isVerifying ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Verifying on Blockchain...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <Search className="w-5 h-5 mr-2" />
                                        Verify Now
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="relative my-12">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-notary-dark text-slate-500">OR</span>
                    </div>
                </div>

                {/* Manual Hash Input */}
                <div className="mb-8">
                    <label className="block text-slate-400 text-sm mb-2">
                        Paste File Hash Manually
                    </label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={manualHash}
                            onChange={(e) => setManualHash(e.target.value)}
                            placeholder="Enter SHA-256 hash..."
                            className="flex-1 px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all font-mono text-sm"
                        />
                        <button
                            onClick={handleManualVerify}
                            disabled={isVerifying || !manualHash}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${isVerifying || !manualHash
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-notary-cyan text-notary-dark hover:bg-notary-cyan-dim'
                                }`}
                        >
                            Verify
                        </button>
                    </div>
                </div>

                {/* Demo Hashes */}
                <div className="mb-12 p-6 rounded-2xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                    <h3 className="text-slate-400 text-sm font-medium mb-4">
                        Try with these demo hashes:
                    </h3>
                    <div className="space-y-2">
                        {documents.slice(0, 3).map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => {
                                    setManualHash(doc.fileHash);
                                    setFile(null);
                                    setFileHash('');
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-notary-dark-secondary transition-colors group"
                            >
                                <span className="font-mono text-xs text-slate-500 group-hover:text-notary-cyan transition-colors">
                                    {truncateHash(doc.fileHash, 20, 12)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="animate-fade-in">
                        {result.found && result.document ? (
                            /* Verified Result */
                            <div className="rounded-2xl overflow-hidden">
                                <div className="bg-notary-success/10 border border-notary-success/30 p-4 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-notary-success mr-2" />
                                    <span className="text-notary-success font-semibold">VERIFIED</span>
                                </div>

                                <div className="notary-card p-6">
                                    {/* Certificate Header */}
                                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-notary-slate-dark/30">
                                        <div>
                                            <h3 className="font-heading text-2xl font-bold text-white mb-1">
                                                {result.document.title}
                                            </h3>
                                            <span className="inline-block px-3 py-1 rounded-full bg-notary-cyan/10 text-notary-cyan text-sm font-medium">
                                                {result.document.documentType}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-full bg-notary-success/10 flex items-center justify-center">
                                                <Award className="w-10 h-10 text-notary-success" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-notary-success flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                                        <div className="p-4 rounded-xl bg-notary-dark">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <User className="w-3 h-3 mr-1" />
                                                Owner
                                            </span>
                                            <p className="text-white font-medium">
                                                {result.document.ownerName}
                                            </p>
                                            <p className="font-mono text-xs text-notary-cyan mt-1">
                                                {truncateHash(result.document.ownerAddress, 8, 6)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Mint Date
                                            </span>
                                            <p className="text-white font-medium">
                                                {formatDate(result.document.mintDate)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <Hash className="w-3 h-3 mr-1" />
                                                Token ID
                                            </span>
                                            <p className="font-mono text-notary-cyan font-bold">
                                                #{result.document.tokenId}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <FileText className="w-3 h-3 mr-1" />
                                                File Name
                                            </span>
                                            <p className="text-white truncate">
                                                {result.document.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Full Hash */}
                                    <div className="p-4 rounded-xl bg-notary-dark mb-6">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            <Hash className="w-3 h-3 mr-1" />
                                            File Hash (SHA-256)
                                        </span>
                                        <p className="font-mono text-xs text-notary-cyan break-all">
                                            {result.document.fileHash}
                                        </p>
                                    </div>

                                    {/* Transaction */}
                                    <div className="p-4 rounded-xl bg-notary-dark">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            Transaction Hash
                                        </span>
                                        <p className="font-mono text-xs text-slate-400 break-all mb-2">
                                            {result.document.transactionHash}
                                        </p>
                                        <a
                                            href="#"
                                            className="inline-flex items-center text-notary-cyan text-sm hover:underline"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            View on Explorer
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Not Found Result */
                            <div className="rounded-2xl overflow-hidden animate-fade-in">
                                <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-500 mr-2" />
                                    <span className="text-red-500 font-semibold">NOT FOUND</span>
                                </div>

                                <div className="notary-card p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                        <XCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="font-heading text-xl font-semibold text-white mb-2">
                                        No Notarization Record Found
                                    </h3>
                                    <p className="text-slate-400 mb-6">
                                        This file has not been notarized on the blockchain.
                                        <br />
                                        Upload and notarize it to create a permanent proof of existence.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Verify;
