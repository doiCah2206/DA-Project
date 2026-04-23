import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wallet, ChevronDown, LogOut, Shield } from "lucide-react";
import { useAppStore } from "../../store";

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { wallet, connectWallet, disconnectWallet } = useAppStore();

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/notarize", label: "Notarize" },
        { path: "/documents", label: "My Documents" },
        { path: "/access-requests", label: "Access Requests" },
        { path: "/shared-documents", label: "Shared Documents" },
        { path: "/verify", label: "Verify" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-notary-dark/90 backdrop-blur-md border-b border-notary-cyan/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-notary-cyan to-blue-600 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-notary-dark" />
                        </div>
                        <span className="font-heading text-xl font-bold text-white">
                            Notarize<span className="text-notary-cyan">X</span>
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    location.pathname === link.path
                                        ? "bg-notary-cyan/10 text-notary-cyan"
                                        : "text-slate-400 hover:text-white hover:bg-notary-dark-secondary"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Wallet Connection */}
                    <div className="flex items-center space-x-3">
                        {wallet.isConnected ? (
                            <div className="flex items-center space-x-2">
                                {/* Network Badge */}
                                <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-notary-success/10 border border-notary-success/30 text-notary-success text-xs font-medium">
                                    <span className="w-2 h-2 rounded-full bg-notary-success mr-2 animate-pulse"></span>
                                    {wallet.network}
                                </div>

                                {/* Wallet Address */}
                                <div className="relative group">
                                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-notary-dark-secondary border border-notary-cyan/20 hover:border-notary-cyan/50 transition-all">
                                        <Wallet className="w-4 h-4 text-notary-cyan" />
                                        <span className="font-mono text-sm text-white">
                                            {truncateAddress(wallet.address!)}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-notary-dark-secondary border border-notary-cyan/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className="px-4 py-2 border-b border-notary-slate-dark">
                                            <p className="text-xs text-slate-400">
                                                Balance
                                            </p>
                                            <p className="font-mono text-sm text-notary-cyan">
                                                {wallet.balance} ETH
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                void disconnectWallet().finally(
                                                    () => {
                                                        navigate("/");
                                                    },
                                                );
                                            }}
                                            className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm">
                                                Disconnect
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={connectWallet}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-notary-cyan text-notary-dark font-semibold hover:bg-notary-cyan-dim transition-all glow-cyan-hover"
                            >
                                <Wallet className="w-4 h-4" />
                                <span>Connect Wallet</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
