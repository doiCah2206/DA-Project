import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Hash,
  Download,
  Share2,
  Eye,
  Award,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "../store";
import type { DocumentType, NotarizedDocument } from "../types";
import {
  downloadOriginalFile,
  downloadEncryptedFile,
} from "../utils/documentDownload";
import { CustomSelect } from "../components/ui";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants/contract";

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
  const { documents, setSelectedDocument, fetchDocuments, token, wallet } =
    useAppStore();
  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<DocumentType | "All">("All");
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<NotarizedDocument | null>(
    null,
  );
  const [listTarget, setListTarget] = useState<NotarizedDocument | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [listError, setListError] = useState<string | null>(null);
  const [listSuccess, setListSuccess] = useState<string | null>(null);
  const [isListing, setIsListing] = useState(false);
  const [shareWalletAddress, setShareWalletAddress] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const documentTypes: DocumentType[] = [
    "Contract",
    "Certificate",
    "ID Document",
    "Legal Agreement",
    "Other",
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
      if (
        new Date(doc.mintDate).getTime() >
        new Date(existing.latest.mintDate).getTime()
      ) {
        existing.latest = doc;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).map((group) => ({
      ...group,
      versions: [...group.versions].sort(
        (a, b) =>
          new Date(b.mintDate).getTime() - new Date(a.mintDate).getTime(),
      ),
    }));
  }, [documents]);

  const filteredGroups = useMemo(() => {
    let filtered = [...groups];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((group) =>
        group.versions.some(
          (doc) =>
            doc.title.toLowerCase().includes(query) ||
            doc.fileName.toLowerCase().includes(query) ||
            doc.description.toLowerCase().includes(query) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(query)),
        ),
      );
    }

    if (filterType !== "All") {
      filtered = filtered.filter((group) =>
        group.versions.some((doc) => doc.documentType === filterType),
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.latest.mintDate).getTime();
      const dateB = new Date(b.latest.mintDate).getTime();
      return sortBy === "recent" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [groups, searchQuery, filterType, sortBy]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateHash = (hash: string, start = 8, end = 6) =>
    `${hash.slice(0, start)}...${hash.slice(-end)}`;

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "PDF";
    if (type.includes("image")) return "IMG";
    if (type.includes("doc")) return "DOC";
    return "FILE";
  };

  const getTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, string> = {
      Contract: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Certificate: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "ID Document": "bg-green-500/20 text-green-400 border-green-500/30",
      "Legal Agreement":
        "bg-orange-500/20 text-orange-400 border-orange-500/30",
      Other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return colors[type];
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleDownloadFile = async (doc: NotarizedDocument) => {
    setDownloadingId(doc.id);
    setDownloadError(null);
    try {
      await downloadOriginalFile(doc);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Khong tai duoc file goc";
      const normalizedMessage = message.toLowerCase();
      const noAccess =
        normalizedMessage.includes("khong co quyen") ||
        normalizedMessage.includes("không có quyền") ||
        normalizedMessage.includes("khong phai vi da mint") ||
        normalizedMessage.includes("không có quyền truy cập");

      if (noAccess) {
        try {
          await downloadEncryptedFile(doc);
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
      setDownloadingId(null);
    }
  };

  const openShareModal = (doc: NotarizedDocument) => {
    setShareTarget(doc);
    setShareWalletAddress("");
    setShareMessage("Shared directly by owner.");
    setShareError(null);
    setShareSuccess(null);
  };

  const openListModal = (doc: NotarizedDocument) => {
    setListTarget(doc);
    setListPrice('');
    setListError(null);
    setListSuccess(null);
  };

  const closeShareModal = () => {
    if (isSharing) return;
    setShareTarget(null);
    setShareWalletAddress("");
    setShareMessage("");
    setShareError(null);
    setShareSuccess(null);
  };

  const closeListModal = () => {
    if (isListing) return;
    setListTarget(null);
    setListPrice('');
    setListError(null);
    setListSuccess(null);
  };

  const handleShareByWallet = async () => {
    if (!shareTarget) return;

    if (!token) {
      setShareError("Chua xac thuc. Vui long ket noi vi lai.");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      setShareError("Vui long ket noi vi truoc khi chia se.");
      return;
    }

    const recipientWalletAddress = shareWalletAddress.trim();
    if (!recipientWalletAddress) {
      setShareError("Vui long nhap dia chi vi nguoi nhan.");
      return;
    }

    setIsSharing(true);
    setShareError(null);
    setShareSuccess(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
        }/documents/${shareTarget.id}/share-by-wallet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-wallet-address": wallet.address,
          },
          body: JSON.stringify({
            recipientWalletAddress,
            message: shareMessage.trim() || null,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({} as { message?: string }));
      if (!response.ok) {
        throw new Error(data.message || "Khong chia se duoc tai lieu");
      }

      setShareSuccess(data.message || "Da chia se thanh cong.");
      setShareWalletAddress("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Khong chia se duoc tai lieu";
      setShareError(message);
    } finally {
      setIsSharing(false);
    }
  };

  const handleListForSale = async () => {
    if (!listTarget) return;

    if (!token) {
      setListError("Chua xac thuc. Vui long ket noi vi lai.");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      setListError("Vui long ket noi vi truoc khi ban tai lieu.");
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setListError("Thieu CONTRACT_ADDRESS trong dapp-fe/.env");
      return;
    }

    const priceValue = Number(listPrice);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setListError("Gia ban khong hop le.");
      return;
    }

    setIsListing(true);
    setListError(null);
    setListSuccess(null);

    try {
      const { BrowserProvider, Contract, parseEther } = await import("ethers");
      if (!window.ethereum) throw new Error("Khong tim thay vi Web3");
      const currentChainId = await window.ethereum.request<string>({ method: "eth_chainId" });
      if (currentChainId !== "0x5aff") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x5aff" }],
          });
        } catch {
          throw new Error("Vui long chuyen sang mang Oasis Sapphire Testnet truoc khi ban");
        }
      }

      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const hashBytes32 = listTarget.fileHash.startsWith("0x")
        ? listTarget.fileHash
        : `0x${listTarget.fileHash}`;
      const weiPrice = parseEther(priceValue.toString());
      const tx = await contract.listDocumentForSale(hashBytes32, weiPrice);
      await tx.wait();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/documents/${listTarget.id}/list-for-sale`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-wallet-address": wallet.address,
          },
          body: JSON.stringify({ price: priceValue }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({} as { message?: string }));

      if (!response.ok) {
        throw new Error(data.message || "Khong tao duoc listing.");
      }

      setListSuccess(data.message || "Da tao listing thanh cong.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Khong tao duoc listing.";
      setListError(message);
    } finally {
      setIsListing(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
            My Documents
          </h1>
          <p className="text-slate-400">
            Click a document to see all its versions.
          </p>
        </div>

        {/* Error Alert */}
        {downloadError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-slide-up">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Download Error</p>
              <p className="text-red-300 text-sm mt-1">{downloadError}</p>
            </div>
            <button
              onClick={() => setDownloadError(null)}
              className="text-red-400 hover:text-red-300 transition-colors ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
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

            <CustomSelect
              value={filterType}
              onChange={(value) => setFilterType(value as DocumentType | "All")}
              options={[
                { label: "All Types", value: "All" },
                ...documentTypes.map((type) => ({ label: type, value: type })),
              ]}
              icon={<Filter className="w-5 h-5 text-slate-400" />}
              className="w-full sm:w-48"
            />

            <CustomSelect
              value={sortBy}
              onChange={(value) => setSortBy(value as "recent" | "oldest")}
              options={[
                { label: "Most Recent", value: "recent" },
                { label: "Oldest First", value: "oldest" },
              ]}
              icon={<Calendar className="w-5 h-5 text-slate-400" />}
              className="w-full sm:w-40"
            />
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">
          Showing {filteredGroups.length} document groups ({documents.length}{" "}
          total versions)
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
                          <h3 className="font-heading font-semibold text-gray-900 truncate max-w-[320px]">
                            {latest.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                                latest.documentType,
                              )}`}
                            >
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

                    <div className="mb-4 p-3 rounded-lg bg-[#E8E4DC]">
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
                        <div
                          key={version.id}
                          className="rounded-xl bg-white border border-[#CCCCCC] p-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-gray-900 font-medium">
                                Version V{group.versions.length - idx} • Token #
                                {version.tokenId}
                              </p>
                              <p className="text-slate-400 text-sm">
                                {version.fileName} •{" "}
                                {formatDate(version.mintDate)}
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
                              {/* <button
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    version.transactionHash,
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                title="Copy Transaction Hash"
                              >
                                <Share2 className="w-4 h-4" />
                              </button> */}
                              <button
                                onClick={() => openListModal(version)}
                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                title="List for Sale"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openShareModal(version)}
                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white transition-colors"
                                title="Share By Wallet"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  void handleDownloadFile(version);
                                }}
                                disabled={downloadingId === version.id}
                                className="p-2 rounded-lg hover:bg-notary-dark-secondary text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Download Original File"
                              >
                                {downloadingId === version.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
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
            <h3 className="font-heading text-xl font-semibold text-gray-900 mb-2">
              No Documents Found
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterType !== "All"
                ? "Try adjusting your search or filter criteria"
                : "Start by notarizing your first document"}
            </p>
          </div>
        )}
      </div>

      {shareTarget ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={closeShareModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#CCCCCC] bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading text-xl font-semibold text-gray-900">
                  Share Document By Wallet
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {shareTarget.title}
                </p>
              </div>
              <button
                onClick={closeShareModal}
                className="text-slate-500 hover:text-white transition-colors"
                disabled={isSharing}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={shareWalletAddress}
                  onChange={(event) =>
                    setShareWalletAddress(event.target.value)
                  }
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-xl bg-notary-dark border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(event) => setShareMessage(event.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-notary-dark border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all text-sm resize-none"
                />
              </div>

              {shareError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
                  {shareError}
                </div>
              ) : null}

              {shareSuccess ? (
                <div className="rounded-xl border border-notary-success/30 bg-notary-success/10 px-3 py-2 text-notary-success text-sm">
                  {shareSuccess}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeShareModal}
                  disabled={isSharing}
                  className="px-4 py-2 rounded-xl border border-notary-slate-dark text-slate-300 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void handleShareByWallet();
                  }}
                  disabled={isSharing}
                  className="px-4 py-2 rounded-xl bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Share Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {listTarget ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={closeListModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-notary-slate-dark bg-notary-dark-secondary p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-heading text-xl font-semibold text-gray-900">
                  List Document for Sale
                </h3>
                <p className="text-slate-400 text-sm mt-1">{listTarget.title}</p>
              </div>
              <button
                onClick={closeListModal}
                className="text-slate-500 hover:text-white transition-colors"
                disabled={isListing}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Price (TEST)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={listPrice}
                  onChange={(event) => setListPrice(event.target.value)}
                  placeholder="0.025"
                  className="w-full px-4 py-3 rounded-xl bg-notary-dark border border-notary-slate-dark text-white placeholder-slate-500 focus:border-notary-cyan focus:ring-1 focus:ring-notary-cyan transition-all text-sm"
                />
              </div>

              {listError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
                  {listError}
                </div>
              ) : null}

              {listSuccess ? (
                <div className="rounded-xl border border-notary-success/30 bg-notary-success/10 px-3 py-2 text-notary-success text-sm">
                  {listSuccess}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={closeListModal}
                  disabled={isListing}
                  className="px-4 py-2 rounded-xl border border-notary-slate-dark text-slate-300 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    void handleListForSale();
                  }}
                  disabled={isListing}
                  className="px-4 py-2 rounded-xl bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isListing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  List Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Documents;