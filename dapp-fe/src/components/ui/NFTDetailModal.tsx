import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    X, ExternalLink, Download, Share2, Award, Calendar,
    Hash, FileText, User, Link as LinkIcon, Shield
} from 'lucide-react';
import { useAppStore } from '../../store';

const NFTDetailModal = () => {
    const { selectedDocument, setSelectedDocument } = useAppStore();

    if (!selectedDocument) return null;

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownloadCertificate = () => {
        alert('Certificate of Notarization\n\n' +
            `Token ID: #${selectedDocument.tokenId}\n` +
            `Title: ${selectedDocument.title}\n` +
            `Document Type: ${selectedDocument.documentType}\n` +
            `Owner: ${selectedDocument.ownerName}\n` +
            `File Hash: ${selectedDocument.fileHash}\n` +
            `Mint Date: ${formatDate(selectedDocument.mintDate)}\n` +
            `Transaction: ${selectedDocument.transactionHash}\n\n` +
            'This certificate verifies that the above document has been notarized on the blockchain.');
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
                                        <svg viewBox="0 0 100 100" className="w-full h-full">
                                            <circle
                                                cx="50" cy="50" r="45"
                                                fill="none"
                                                stroke="#F5C842"
                                                strokeWidth="3"
                                                strokeDasharray="5,5"
                                            />
                                            <circle
                                                cx="50" cy="50" r="35"
                                                fill="none"
                                                stroke="#F5C842"
                                                strokeWidth="2"
                                            />
                                            <text
                                                x="50" y="55"
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
                                            onClick={() => setSelectedDocument(null)}
                                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        {/* Title and Badge */}
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-notary-cyan/20 to-purple-500/20 flex items-center justify-center">
                                                <Shield className="w-7 h-7 text-notary-cyan" />
                                            </div>
                                            <div>
                                                <h2 className="font-heading text-2xl font-bold text-white">
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
                                                Token ID #{selectedDocument.tokenId}
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
                                            <p className="text-white font-medium">
                                                {selectedDocument.ownerName}
                                            </p>
                                            <p className="font-mono text-xs text-notary-cyan mt-1">
                                                {selectedDocument.ownerAddress.slice(0, 10)}...{selectedDocument.ownerAddress.slice(-8)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Mint Date
                                            </span>
                                            <p className="text-white font-medium">
                                                {formatDate(selectedDocument.mintDate)}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <FileText className="w-3 h-3 mr-1" />
                                                Document Type
                                            </span>
                                            <p className="text-white font-medium">
                                                {selectedDocument.documentType}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs flex items-center mb-2">
                                                <FileText className="w-3 h-3 mr-1" />
                                                File Name
                                            </span>
                                            <p className="text-white font-medium truncate">
                                                {selectedDocument.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedDocument.description && (
                                        <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                            <span className="text-slate-500 text-xs block mb-2">Description</span>
                                            <p className="text-slate-300">
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
                                        <p className="font-mono text-xs text-slate-400 break-all">
                                            {selectedDocument.transactionHash}
                                        </p>
                                    </div>

                                    {/* IPFS URI */}
                                    <div className="p-4 rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/30">
                                        <span className="text-slate-500 text-xs flex items-center mb-2">
                                            <LinkIcon className="w-3 h-3 mr-1" />
                                            IPFS Metadata URI
                                        </span>
                                        <p className="font-mono text-xs text-slate-400 break-all">
                                            {selectedDocument.ipfsUri}
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    {selectedDocument.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDocument.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 rounded-full bg-notary-dark-secondary border border-notary-slate-dark text-slate-400 text-xs"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={handleDownloadCertificate}
                                        className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-notary-gold text-notary-dark font-semibold hover:bg-notary-gold-dim transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Download Certificate</span>
                                    </button>

                                    <button
                                        onClick={() => navigator.clipboard.writeText(selectedDocument.transactionHash)}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-notary-cyan text-notary-cyan font-semibold hover:bg-notary-cyan/10 transition-all"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => alert('Coming soon!')}
                                        className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-notary-slate-dark text-slate-400 font-semibold hover:border-notary-cyan/50 hover:text-white transition-all"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
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
