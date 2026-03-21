import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
    Upload, FileText, Copy, Check, ChevronRight, ChevronLeft,
    Loader2, AlertCircle, X, Sparkles
} from 'lucide-react';
import { useAppStore } from '../store';
import type { NotarizeStep, DocumentType, NotarizeFormData, MintingStatus, NotarizedDocument } from '../types';

const Notarize = () => {
    const navigate = useNavigate();
    const { wallet, addDocument } = useAppStore();
    const [step, setStep] = useState<NotarizeStep>(1);
    const [formData, setFormData] = useState<NotarizeFormData>({
        file: null,
        fileHash: '',
        title: '',
        documentType: 'Contract',
        description: '',
        ownerName: '',
        tags: [],
    });
    const [tagsInput, setTagsInput] = useState('');
    const [mintingStatus, setMintingStatus] = useState<MintingStatus>('idle');
    const [mintingStep, setMintingStep] = useState('');
    const [copied, setCopied] = useState(false);
    const [mintedDoc, setMintedDoc] = useState<NotarizedDocument | null>(null);

    // Compute SHA-256 hash
    const computeHash = useCallback(async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            void computeHash(file).then((hash) => {
                setFormData(prev => ({ ...prev, file, fileHash: hash }));
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

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('doc')) return '📝';
        return '📎';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.file !== null;
            case 2:
                return formData.title && formData.ownerName;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const handleMint = async () => {
        if (!wallet.isConnected || !formData.file) return;

        setMintingStatus('preparing');

        // Simulate minting process
        const steps = [
            { status: 'preparing', message: 'Preparing metadata...' },
            { status: 'uploading', message: 'Uploading to IPFS...' },
            { status: 'minting', message: 'Minting NFT on blockchain...' },
        ];

        for (const s of steps) {
            setMintingStep(s.message);
            setMintingStatus(s.status as MintingStatus);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Generate mock transaction hash
        const txHash = '0x' + Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');

        // Create new document
        const newDoc: NotarizedDocument = {
            id: Date.now().toString(),
            tokenId: (Math.floor(Math.random() * 10000) + 1250).toString(),
            fileHash: formData.fileHash,
            fileName: formData.file!.name,
            fileSize: formData.file!.size,
            fileType: formData.file!.type,
            title: formData.title,
            documentType: formData.documentType,
            description: formData.description,
            ownerName: formData.ownerName,
            ownerAddress: wallet.address!,
            tags: formData.tags,
            mintDate: new Date(),
            transactionHash: txHash,
            ipfsUri: 'ipfs://Qm' + Array.from({ length: 44 }, () =>
                Math.random().toString(36).charAt(2)
            ).join(''),
        };

        setMintedDoc(newDoc);
        addDocument(newDoc);
        setMintingStatus('success');
    };

    const documentTypes: DocumentType[] = [
        'Contract',
        'Certificate',
        'ID Document',
        'Legal Agreement',
        'Other',
    ];

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((s, index) => (
                <div key={s} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-heading font-bold transition-all ${step >= s
                        ? 'bg-notary-cyan border-notary-cyan text-notary-dark'
                        : 'border-slate-600 text-slate-500'
                        }`}>
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {index < 2 && (
                        <div className={`w-16 sm:w-24 h-0.5 mx-2 transition-all ${step > s ? 'bg-notary-cyan' : 'bg-slate-700'
                            }`}></div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">
                    Upload Your File
                </h2>
                <p className="text-slate-400">
                    Drag and drop any file to create its unique digital fingerprint
                </p>
            </div>

            {!formData.file ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive
                        ? 'border-notary-cyan bg-notary-cyan/5'
                        : 'border-slate-700 hover:border-notary-cyan/50 hover:bg-notary-dark-secondary/50'
                        }`}
                >
                    <input {...dropzoneInputProps} />
                    <div className="w-20 h-20 rounded-full bg-notary-cyan/10 flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-notary-cyan" />
                    </div>
                    <p className="text-white font-medium text-lg mb-2">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                    </p>
                    <p className="text-slate-500">or click to browse</p>
                    <p className="text-slate-600 text-sm mt-4">Supports any file type</p>
                </div>
            ) : (
                <div className="notary-card rounded-2xl p-6 animate-slide-up">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-3xl">
                                {getFileIcon(formData.file.type)}
                            </div>
                            <div>
                                <h3 className="font-heading font-semibold text-white text-lg">
                                    {formData.file.name}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {formatFileSize(formData.file.size)} • {formData.file.type || 'Unknown type'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, file: null, fileHash: '' }))}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-notary-dark rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">SHA-256 Hash</span>
                            <button
                                onClick={() => copyToClipboard(formData.fileHash)}
                                className="flex items-center space-x-1 text-notary-cyan text-sm hover:text-notary-cyan/80 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <p className="font-mono text-xs text-slate-500 break-all">
                            {formData.fileHash}
                        </p>
                    </div>

                    <p className="text-slate-500 text-sm mt-4 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-notary-cyan mr-2"></span>
                        This hash is your file's unique digital fingerprint
                    </p>
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">
                    Fill Metadata
                </h2>
                <p className="text-slate-400">
                    Provide details about your document
                </p>
            </div>

            <div className="grid gap-6">
                <div>
                    <label className="block text-slate-400 text-sm mb-2">Document Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Employment Contract - John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">Document Type *</label>
                    <select
                        value={formData.documentType}
                        onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as DocumentType }))}
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    >
                        {documentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the document..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">Owner Name *</label>
                    <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    />
                </div>

                <div>
                    <label className="block text-slate-400 text-sm mb-2">Tags (comma-separated)</label>
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => {
                            setTagsInput(e.target.value);
                            const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                            setFormData(prev => ({ ...prev, tags }));
                        }}
                        placeholder="e.g., contract, legal, important"
                        className="w-full px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                    />
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-notary-dark-secondary to-notary-dark border border-notary-cyan/20">
                <h3 className="text-notary-cyan text-sm font-medium mb-4">NFT Preview</h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Title</span>
                        <span className="text-white">{formData.title || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Type</span>
                        <span className="text-white">{formData.documentType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">Owner</span>
                        <span className="text-white">{formData.ownerName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">File Hash</span>
                        <span className="font-mono text-xs text-notary-cyan">
                            {formData.fileHash.slice(0, 16)}...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => {
        if (mintedDoc) {
            return (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-notary-success/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Sparkles className="w-12 h-12 text-notary-success" />
                    </div>

                    <h2 className="font-heading text-3xl font-bold text-white mb-4">
                        Successfully Notarized!
                    </h2>

                    <p className="text-slate-400 mb-8">
                        Your document has been permanently recorded on the blockchain
                    </p>

                    <div className="notary-card rounded-2xl p-6 text-left mb-8">
                        <div className="space-y-4">
                            <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                                <span className="text-slate-400">Token ID</span>
                                <span className="font-mono text-notary-cyan">#{mintedDoc.tokenId}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                                <span className="text-slate-400">Transaction</span>
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
                                setFormData({
                                    file: null,
                                    fileHash: '',
                                    title: '',
                                    documentType: 'Contract',
                                    description: '',
                                    ownerName: '',
                                    tags: [],
                                });
                                setTagsInput('');
                                setMintingStatus('idle');
                                setMintedDoc(null);
                            }}
                            className="px-6 py-3 rounded-xl border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/10 transition-all"
                        >
                            Notarize Another
                        </button>
                        <button
                            onClick={() => navigate('/documents')}
                            className="px-6 py-3 rounded-xl bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim transition-all glow-cyan-hover"
                        >
                            View My Documents
                        </button>
                    </div>
                </div>
            );
        }

        if (mintingStatus !== 'idle') {
            return (
                <div className="text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-notary-cyan/10 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-12 h-12 text-notary-cyan animate-spin" />
                    </div>

                    <h2 className="font-heading text-2xl font-bold text-white mb-4">
                        Minting Your NFT
                    </h2>

                    <p className="text-notary-cyan mb-8 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {mintingStep}
                    </p>

                    {/* Progress bar */}
                    <div className="max-w-md mx-auto">
                        <div className="h-2 bg-notary-dark-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-notary-cyan to-purple-500 transition-all duration-500"
                                style={{
                                    width: mintingStatus === 'preparing' ? '33%' :
                                        mintingStatus === 'uploading' ? '66%' :
                                            mintingStatus === 'minting' ? '90%' : '100%'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="font-heading text-2xl font-bold text-white mb-2">
                        Review & Mint
                    </h2>
                    <p className="text-slate-400">
                        Confirm details before creating your notarization NFT
                    </p>
                </div>

                <div className="notary-card rounded-2xl p-6">
                    <h3 className="font-heading text-lg font-semibold text-white mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-notary-cyan" />
                        Notarization Summary
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-400">Document</span>
                            <span className="text-white">{formData.file?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-400">Title</span>
                            <span className="text-white">{formData.title}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-400">Type</span>
                            <span className="text-white">{formData.documentType}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-notary-slate-dark/30">
                            <span className="text-slate-400">Owner</span>
                            <span className="text-white">{formData.ownerName}</span>
                        </div>
                        <div className="py-2">
                            <span className="text-slate-400 block mb-2">File Hash</span>
                            <p className="font-mono text-xs text-notary-cyan break-all bg-notary-dark p-3 rounded-lg">
                                {formData.fileHash}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-notary-gold/10 border border-notary-gold/30">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-notary-gold mr-3" />
                        <span className="text-slate-300">Estimated Gas Fee</span>
                    </div>
                    <span className="font-mono text-notary-gold font-semibold">~0.003 ETH</span>
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

    // Check wallet connection
    useEffect(() => {
        if (!wallet.isConnected) {
            navigate('/');
        }
    }, [wallet.isConnected, navigate]);

    if (!wallet.isConnected) {
        return null;
    }

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {renderStepIndicator()}

                {step !== 3 || mintedDoc ? (
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => step > 1 && setStep((step - 1) as NotarizeStep)}
                            disabled={step === 1}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${step === 1
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-white hover:bg-notary-dark-secondary'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span>Back</span>
                        </button>

                        <button
                            onClick={() => step < 3 && setStep((step + 1) as NotarizeStep)}
                            disabled={!canProceed()}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${!canProceed()
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-notary-cyan text-notary-dark hover:bg-notary-cyan-dim glow-cyan-hover'
                                }`}
                        >
                            <span>{step === 2 ? 'Continue' : 'Next'}</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : null}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
};

export default Notarize;
