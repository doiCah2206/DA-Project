import { useState, useMemo, useEffect } from 'react';
import {
    Search, Filter, FileText, Calendar, Hash,
    Download, Share2, Eye, Award
} from 'lucide-react';
import { useAppStore } from '../store';
import type { DocumentType } from '../types';

const Documents = () => {
    const { documents, setSelectedDocument, fetchDocuments } = useAppStore();
    useEffect(() => { void fetchDocuments(); }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<DocumentType | 'All'>('All');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

    const documentTypes: DocumentType[] = [
        'Contract',
        'Certificate',
        'ID Document',
        'Legal Agreement',
        'Other',
    ];

    const filteredDocuments = useMemo(() => {
        let filtered = [...documents];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.title.toLowerCase().includes(query) ||
                doc.fileName.toLowerCase().includes(query) ||
                doc.description.toLowerCase().includes(query) ||
                doc.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Type filter
        if (filterType !== 'All') {
            filtered = filtered.filter(doc => doc.documentType === filterType);
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.mintDate).getTime();
            const dateB = new Date(b.mintDate).getTime();
            return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [documents, searchQuery, filterType, sortBy]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const truncateHash = (hash: string, start = 8, end = 6) => {
        return `${hash.slice(0, start)}...${hash.slice(-end)}`;
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('doc')) return '📝';
        return '📎';
    };

    const getTypeColor = (type: DocumentType) => {
        const colors: Record<DocumentType, string> = {
            'Contract': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Certificate': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'ID Document': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Legal Agreement': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'Other': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        return colors[type];
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold text-white mb-2">
                        My Documents
                    </h1>
                    <p className="text-slate-400">
                        All your notarized documents stored on the blockchain
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as DocumentType | 'All')}
                            className="appearance-none w-full sm:w-48 px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all pr-10"
                        >
                            <option value="All">All Types</option>
                            {documentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
                            className="appearance-none w-full sm:w-40 px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all pr-10"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Results count */}
                <p className="text-slate-500 text-sm mb-6">
                    Showing {filteredDocuments.length} of {documents.length} documents
                </p>

                {/* Documents Grid */}
                {filteredDocuments.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map((doc, index) => (
                            <div
                                key={doc.id}
                                className="group notary-card rounded-2xl p-6 notary-card-hover transition-all duration-300 animate-fade-in cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => setSelectedDocument(doc)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-2xl">
                                            {getFileIcon(doc.fileType)}
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-semibold text-white truncate max-w-[180px]">
                                                {doc.title}
                                            </h3>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(doc.documentType)}`}>
                                                {doc.documentType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Verified Badge */}
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-notary-success/20 flex items-center justify-center">
                                            <Award className="w-4 h-4 text-notary-success" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-notary-success animate-pulse"></div>
                                    </div>
                                </div>

                                {/* Hash */}
                                <div className="mb-4 p-3 rounded-lg bg-notary-dark">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 text-xs flex items-center">
                                            <Hash className="w-3 h-3 mr-1" />
                                            File Hash
                                        </span>
                                        <span className="font-mono text-xs text-notary-cyan">
                                            {truncateHash(doc.fileHash)}
                                        </span>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-sm mb-4">
                                    <div className="flex items-center text-slate-400">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {formatDate(doc.mintDate)}
                                    </div>
                                    <div className="font-mono text-xs text-slate-500">
                                        #{doc.tokenId}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-notary-slate-dark/30">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDocument(doc);
                                        }}
                                        className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg bg-notary-cyan/10 text-notary-cyan text-sm font-medium hover:bg-notary-cyan/20 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>View</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(doc.transactionHash);
                                        }}
                                        className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                        title="Copy Transaction Hash"
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            alert('Certificate download coming soon!');
                                        }}
                                        className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                        title="Download Certificate"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20">
                        <div className="w-24 h-24 rounded-full bg-notary-dark-secondary flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-12 h-12 text-slate-600" />
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white mb-2">
                            No Documents Found
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {searchQuery || filterType !== 'All'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Start by notarizing your first document'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
