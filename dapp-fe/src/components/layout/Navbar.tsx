import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wallet, ChevronDown, LogOut } from "lucide-react";
import { useAppStore } from "../../store";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { wallet, connectWallet, disconnectWallet } = useAppStore();

    const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const navLinks = [
        { path: "/notarize", label: "Upload" },
        { path: "/documents", label: "My Docs" },
        { path: "/access-requests", label: "Access Requests" },
        { path: "/shared-documents", label: "Shared" },
        { path: "/market", label: "Marketplace" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F0]/90 backdrop-blur-md border-b border-[#E8E4DC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#0D0D0D] flex items-center justify-center">
                            <span className="text-white text-xs font-bold font-heading">✦</span>
                        </div>
                        <span className="font-heading text-[15px] font-bold text-[#0D0D0D] tracking-tight">
                            ✦ Doc<span className="text-[#ff5e89]">Chain</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-full text-sm transition-all duration-200 ${location.pathname === link.path
                                    ? "bg-[#0D0D0D] text-white font-medium"
                                    : "text-[#666] hover:text-[#0D0D0D] hover:bg-[#E8E4DC]"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {wallet.isConnected ? (
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1A650] border border-[#F1A650] text-white text-1xs font-medium transition-colors hover:bg-[#0D0D0D] hover:border-[#0D0D0D]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                                    {wallet.network}
                                </div>
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#0D0D0D] bg-transparent text-[#0D0D0D] transition-all text-sm hover:bg-[#D56D88] hover:text-white">
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span className="font-mono">{truncateAddress(wallet.address!)}</span>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white border border-[#E8E4DC] rounded-xl shadow-lg shadow-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className="px-4 py-2 border-b border-[#E8E4DC]">
                                            <p className="text-xs text-[#888] mb-0.5">Balance</p>
                                            <p className="font-mono text-sm text-[#1A56FF] font-medium">{wallet.balance} TEST</p>
                                        </div>
                                        <button
                                            onClick={() => { void disconnectWallet().finally(() => navigate("/")); }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors text-sm"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={connectWallet}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0D0D0D] bg-transparent text-[#0D0D0D] text-sm font-medium hover:bg-[#0D0D0D] hover:text-white transition-all duration-200"
                            >
                                <Wallet className="w-3.5 h-3.5" />
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
