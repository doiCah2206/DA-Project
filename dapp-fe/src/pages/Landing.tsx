import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, FileCheck, Clock, Zap, FileText, Award, Lock } from 'lucide-react';
import { useAppStore } from '../store';

const Landing = () => {
    const navigate = useNavigate();
    const { connectWallet, wallet } = useAppStore();

    const handleStart = async () => {
        if (!wallet.isConnected) {
            await connectWallet();
        }
        navigate('/notarize');
    };

    const features = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: 'Blockchain Security',
            description: 'Your documents are secured with immutable blockchain technology',
        },
        {
            icon: <FileCheck className="w-6 h-6" />,
            title: 'Instant Verification',
            description: 'Anyone can verify the authenticity of your documents in seconds',
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: 'Cryptographic Proof',
            description: 'SHA-256 hashing creates unique digital fingerprints',
        },
    ];

    const stats = [
        { value: '4,000', label: 'Files Notarized' },
        { value: '3,291', label: 'NFTs Minted' },
        { value: '99.99%', label: 'Uptime' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-notary-cyan/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-notary-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-notary-cyan/10 border border-notary-cyan/20 text-notary-cyan text-sm font-medium mb-8 animate-fade-in">
                        <Zap className="w-4 h-4 mr-2" />
                        Powered by Oasis Sapphire
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
                        Notarize Your Files
                        <span className="block gradient-text">On Blockchain</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Công chứng tài liệu bất biến trên blockchain.
                        Create immutable proof of existence for any file with NFT technology.
                    </p>

                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={handleStart}
                            className="group flex items-center space-x-2 px-8 py-4 rounded-xl bg-notary-cyan text-notary-dark font-heading font-bold text-lg hover:bg-notary-cyan-dim transition-all glow-cyan-hover"
                        >
                            <span>Connect Wallet & Start</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => navigate('/verify')}
                            className="flex items-center space-x-2 px-8 py-4 rounded-xl border border-notary-slate-dark text-slate-300 font-heading font-semibold hover:border-notary-cyan/50 hover:text-white transition-all"
                        >
                            <FileCheck className="w-5 h-5" />
                            <span>Verify a File</span>
                        </button>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-20 flex flex-wrap justify-center gap-8 sm:gap-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="font-heading text-3xl sm:text-4xl font-bold text-notary-cyan">{stat.value}</p>
                                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1">
                        <div className="w-1.5 h-3 bg-notary-cyan rounded-full animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
                            Why Choose NotarizeX?
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            The most secure and transparent way to prove document existence
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-8 rounded-2xl notary-card notary-card-hover transition-all duration-300"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-14 h-14 rounded-xl bg-notary-cyan/10 flex items-center justify-center text-notary-cyan mb-6 group-hover:bg-notary-cyan/20 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="font-heading text-xl font-semibold text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-notary-dark-secondary/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Three simple steps to notarize your documents
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                icon: <FileText className="w-8 h-8" />,
                                title: 'Upload Your File',
                                description: 'Drag and drop any file to create its unique SHA-256 hash',
                            },
                            {
                                step: '02',
                                icon: <Award className="w-8 h-8" />,
                                title: 'Add Metadata',
                                description: 'Provide document details like title, type, and ownership information',
                            },
                            {
                                step: '03',
                                icon: <Clock className="w-8 h-8" />,
                                title: 'Mint as NFT',
                                description: 'Your document hash is permanently recorded on the blockchain',
                            },
                        ].map((item, index) => (
                            <div key={index} className="relative">
                                <div className="p-8 rounded-2xl bg-notary-dark border border-notary-slate-dark/30 h-full">
                                    <span className="font-heading text-6xl font-bold text-notary-cyan/10 absolute top-4 right-4">
                                        {item.step}
                                    </span>
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-notary-cyan/20 to-purple-500/20 flex items-center justify-center text-notary-cyan mb-6">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-heading text-xl font-semibold text-white mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-400">
                                        {item.description}
                                    </p>
                                </div>

                                {index < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="w-8 h-8 text-notary-cyan/30" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-notary-cyan/5 to-purple-500/5"></div>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
                        Ready to Secure Your Documents?
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
                        Join thousands of users who have already notarized their important documents on the blockchain.
                    </p>
                    <button
                        onClick={handleStart}
                        className="inline-flex items-center space-x-2 px-10 py-5 rounded-xl bg-notary-cyan text-notary-dark font-heading font-bold text-xl hover:bg-notary-cyan-dim transition-all glow-cyan-hover"
                    >
                        <span>Get Started Now</span>
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-notary-slate-dark/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-6 h-6 text-notary-cyan" />
                            <span className="font-heading text-lg font-bold text-white">
                                Notarize<span className="text-notary-cyan">X</span>
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            © 2024 NotarizeX. Built on Oasis Sapphire.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
