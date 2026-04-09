import { useState, useMemo, useEffect } from 'react';
import {
    Search, Filter, FileText, Calendar, Hash,
    Download, Share2, Eye, Award, ChevronDown, ChevronUp, GitBranch,
} from 'lucide-react';
import { useAppStore } from '../store';
import type { DocumentType, NotarizedDocument } from '../types';
import { downloadOriginalFile } from '../utils/documentDownload';

type DocumentGroup = {
    key: string;
    latest: NotarizedDocument;
    versions: NotarizedDocument[];
};

const getVersionGroupKey = (doc: NotarizedDocument): string => {
    const title = doc.title.trim().toLowerCase();
    const owner = doc.ownerAddress.trim().toLowerCase();
    return `${title}::${owner}`;
};

const Documents = () => {
    const { documents, setSelectedDocument, fetchDocuments } = useAppStore();
    useEffect(() => { void fetchDocuments(); }, [fetchDocuments]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<DocumentType | 'All'>('All');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const documentTypes: DocumentType[] = [
        'Contract',
        'Certificate',
        'ID Document',
        'Legal Agreement',
        'Other',
    ];

    const groups = useMemo(() => {
        const map = new Map<string, DocumentGroup>();

        documents.forEach((doc) => {
            const key = getVersionGroupKey(doc);
            const existing = map.get(key);
            if (!existing) {
                map.set(key, { key, latest: doc, versions: [doc] });
                return;
            }

            existing.versions.push(doc);
            if (new Date(doc.mintDate).getTime() > new Date(existing.latest.mintDate).getTime()) {
                existing.latest = doc;
            }
            map.set(key, existing);
        });

        return Array.from(map.values()).map((group) => ({
            ...group,
            versions: [...group.versions].sort((a, b) => (
                new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime()
            )),
        }));
    }, [documents]);

    const filteredGroups = useMemo(() => {
        let filtered = [...groups];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((group) => (
                group.versions.some((doc) => (
                    doc.title.toLowerCase().includes(query)
                    || doc.fileName.toLowerCase().includes(query)
                    || doc.description.toLowerCase().includes(query)
                    || doc.tags.some((tag) => tag.toLowerCase().includes(query))
                ))
            ));
        }

        if (filterType !== 'All') {
            filtered = filtered.filter((group) => (
                group.versions.some((doc) => doc.documentType === filterType)
            ));
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.latest.mintDate).getTime();
            const dateB = new Date(b.latest.mintDate).getTime();
            return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [groups, searchQuery, filterType, sortBy]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const truncateHash = (hash: string, start = 8, end = 6) => `${hash.slice(0, start)}...${hash.slice(-end)}`;

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return 'PDF';
        if (type.includes('image')) return 'IMG';
        if (type.includes('doc')) return 'DOC';
        return 'FILE';
    };

    const getTypeColor = (type: DocumentType) => {
        const colors: Record<DocumentType, string> = {
            Contract: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            Certificate: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'ID Document': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Legal Agreement': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            Other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        return colors[type];
    };

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey],
        }));
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold text-white mb-2">
                        My Documents
                    </h1>
                    <p className="text-slate-400">
                        Click a document to see all its versions.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
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

                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as DocumentType | 'All')}
                            className="appearance-none w-full sm:w-48 px-4 py-3 rounded-xl bg-notary-dark-secondary border border-notary-slate-dark text-white focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all pr-10"
                        >
                            <option value="All">All Types</option>
                            {documentTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>

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

                <p className="text-slate-500 text-sm mb-6">
                    Showing {filteredGroups.length} document groups ({documents.length} total versions)
                </p>

                {filteredGroups.length > 0 ? (
                    <div className="space-y-5">
                        {filteredGroups.map((group, index) => {
                            const expanded = Boolean(expandedGroups[group.key]);
                            const latest = group.latest;

                            return (
                                <div
                                    key={group.key}
                                    className="group notary-card rounded-2xl p-6 transition-all duration-300 animate-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <button
                                        onClick={() => toggleGroup(group.key)}
                                        className="w-full text-left"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-xs font-semibold text-notary-cyan">
                                                    {getFileIcon(latest.fileType)}
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-semibold text-white truncate max-w-[320px]">
                                                        {latest.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(latest.documentType)}`}>
                                                            {latest.documentType}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-notary-dark text-notary-cyan border border-notary-cyan/20">
                                                            <GitBranch className="w-3 h-3 mr-1" />
                                                            {group.versions.length} version(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-full bg-notary-success/20 flex items-center justify-center">
                                                        <Award className="w-4 h-4 text-notary-success" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-notary-success animate-pulse"></div>
                                                </div>
                                                {expanded ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4 p-3 rounded-lg bg-notary-dark">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 text-xs flex items-center">
                                                    <Hash className="w-3 h-3 mr-1" />
                                                    Latest Version Hash
                                                </span>
                                                <span className="font-mono text-xs text-notary-cyan">
                                                    {truncateHash(latest.fileHash)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-slate-400">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {formatDate(latest.mintDate)}
                                            </div>
                                            <div className="font-mono text-xs text-slate-500">
                                                Latest #{latest.tokenId}
                                            </div>
                                        </div>
                                    </button>

                                    {expanded ? (
                                        <div className="mt-5 pt-5 border-t border-notary-slate-dark/30 space-y-3">
                                            {group.versions.map((version, idx) => (
                                                <div key={version.id} className="rounded-xl bg-notary-dark-secondary/50 border border-notary-slate-dark/40 p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                Version V{group.versions.length - idx} • Token #{version.tokenId}
                                                            </p>
                                                            <p className="text-slate-400 text-sm">
                                                                {version.fileName} • {formatDate(version.mintDate)}
                                                            </p>
                                                            <p className="font-mono text-xs text-notary-cyan mt-1 break-all">
                                                                {version.fileHash}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedDocument(version)}
                                                                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg bg-notary-cyan/10 text-notary-cyan text-sm font-medium hover:bg-notary-cyan/20 transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>View</span>
                                                            </button>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(version.transactionHash)}
                                                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                                                title="Copy Transaction Hash"
                                                            >
                                                                <Share2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    void downloadOriginalFile(version).catch((error: unknown) => {
                                                                        const message = error instanceof Error ? error.message : 'Khong tai duoc file goc';
                                                                        alert(message);
                                                                    });
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                                                title="Download Original File"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                ) : (
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
