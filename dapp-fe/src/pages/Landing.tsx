import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Share2, ShoppingBag, Shield, Search, Zap, Lock, Globe, Star, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const navigate = useNavigate();
    const { connectWallet, wallet } = useAppStore();

    const pillRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<HTMLDivElement>(null);
    const ctaSectionRef = useRef<HTMLDivElement>(null);
    const flipRef = useRef<HTMLDivElement>(null);
    const whyRef = useRef<HTMLDivElement>(null);
    const whyPanelRef = useRef<HTMLDivElement>(null);
    const cardStackRef = useRef<HTMLDivElement>(null);
    const howItWorksWrapRef = useRef<HTMLDivElement>(null);
    const darkPanelRef = useRef<HTMLDivElement>(null);

    const handleStart = async () => {
        if (!wallet.isConnected) await connectWallet();
        navigate('/notarize');
    };

    const features = [
        { icon: <Upload className="w-5 h-5" />, title: 'Store on-chain', description: 'Upload any document and anchor its hash permanently on the blockchain. No one can alter or delete it.' },
        { icon: <Share2 className="w-5 h-5" />, title: 'Share & collaborate', description: 'Grant granular access to colleagues, clients, or the public — all controlled by your wallet.' },
        { icon: <ShoppingBag className="w-5 h-5" />, title: 'Sell your docs', description: 'Monetize research papers, contracts, templates, and more. Buyers get verified, tamper-proof copies.' },
    ];

    const stats = [
        { value: '12,400+', label: 'Docs stored' },
        { value: '3,800', label: 'NFTs minted' },
        { value: '$94K', label: 'Volume traded' },
    ];

    const steps = [
        { step: '01', icon: <Upload className="w-7 h-7" />, title: 'Upload your file', description: 'Drag and drop any document. We compute its SHA-256 hash instantly in your browser.' },
        { step: '02', icon: <Shield className="w-7 h-7" />, title: 'Mint as NFT', description: 'Your document hash is recorded on-chain — immutable proof of ownership and timestamp.' },
        { step: '03', icon: <ShoppingBag className="w-7 h-7" />, title: 'Store, share or sell', description: 'Keep it private, share with specific wallets, or list it on the marketplace for anyone to buy.' },
    ];

    // ── Typewriter ──
    useEffect(() => {
        if (!titleRef.current) return;
        const el = titleRef.current;
        el.style.fontWeight = '503'
        const lines = [
            { text: 'Store, share and ', italic: false },
            { text: 'sell documents', italic: false },
            { text: 'on-chain.', italic: true, muted: true },
        ];
        el.innerHTML = '';
        const lineEls = lines.map((l) => {
            const div = document.createElement('div');
            div.style.cssText = 'display:block; overflow:hidden;';
            if (l.italic) { div.style.fontStyle = 'italic'; div.style.color = '#aaa'; }
            el.appendChild(div);
            return div;
        });
        const caret = document.createElement('span');
        caret.style.cssText = 'display:inline-block; width:3px; height:.8em; background:#1A56FF; margin-left:4px; vertical-align:middle; border-radius:2px; animation: twBlink .75s step-end infinite;';
        let li = 0, ci = 0;
        const SPEED = 42, PAUSE = 280;
        function type() {
            if (li >= lines.length) {
                caret.remove();
                gsap.to(subRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
                gsap.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: 'power3.out' });
                gsap.to(statsRef.current, { opacity: 1, y: 0, duration: 0.7, delay: 0.35, ease: 'power3.out' });
                return;
            }
            const text = lines[li].text;
            const div = lineEls[li];
            if (ci === 0) div.appendChild(caret);
            if (ci < text.length) {
                div.insertBefore(document.createTextNode(text[ci]), caret);
                ci++; setTimeout(type, SPEED);
            } else { li++; ci = 0; setTimeout(type, PAUSE); }
        }
        const t = setTimeout(type, 500);
        return () => clearTimeout(t);
    }, []);

    // ── GSAP entrance + scroll animations ──
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(pillRef.current, { opacity: 0, y: -16, duration: 0.6, ease: 'power3.out', delay: 0.1 });
            gsap.from(['#pl-card1', '#pl-card2', '#pl-card3'], {
                opacity: 0, y: 30, scale: 0.94,
                stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.3,
            });

            const layers = [
                { id: 'pl-circle', speed: 0.12 }, { id: 'pl-ring', speed: 0.28 },
                { id: 'pl-rect', speed: 0.40 }, { id: 'pl-dots', speed: 0.33 },
                { id: 'pl-arc', speed: 0.25 }, { id: 'pl-line', speed: 0.20 },
            ];
            [...layers, { id: 'pl-card1', speed: 0.48 * 0.4 }, { id: 'pl-card2', speed: 0.55 * 0.4 }, { id: 'pl-card3', speed: 0.50 * 0.4 }]
                .forEach(({ id, speed }) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    ScrollTrigger.create({
                        trigger: 'body',
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                        onUpdate: (self) => {
                            gsap.set(el, { y: -(self.scroll() * speed) });
                        },
                    });
                });

            if (featuresRef.current) {
                gsap.from(featuresRef.current.querySelectorAll('.feature-card'), {
                    opacity: 0, y: 40, stagger: 0.12, duration: 0.7, ease: 'power3.out',
                    scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
                });
            }
            // ── HOW IT WORKS: expand → cards fly up → heading typewriter center → heading moves up → flip cards stagger in ──
            if (howItWorksWrapRef.current && darkPanelRef.current && cardStackRef.current) {
                const cards = Array.from(cardStackRef.current.querySelectorAll('.stack-card'));
                const totalCards = cards.length;
                const vw = window.innerWidth;
                const vh = window.innerHeight;

                // Set initial dark box
                gsap.set(darkPanelRef.current, {
                    width: Math.min(vw * 0.85, 1000),
                    height: vh * 0.65,
                    borderRadius: 28,
                    xPercent: -50,
                    yPercent: -50,
                    top: '50%',
                    left: '50%',
                    position: 'absolute',
                });

                // Stack cards initial positions
                cards.forEach((card, i) => {
                    gsap.set(card, {
                        y: i * 16,
                        rotate: (i - 1) * 3,
                        scale: 1 - i * 0.05,
                        zIndex: totalCards - i,
                        opacity: 1,
                    });
                });

                // Hide flip cards + heading initially
                if (flipRef.current) {
                    gsap.set(flipRef.current.querySelectorAll('.flip-card'), { opacity: 0, y: 50, scale: 0.92 });
                }
                const flipHeading = darkPanelRef.current.querySelector('.flip-heading') as HTMLElement | null;
                const flipHeadingLabel = darkPanelRef.current.querySelector('.flip-heading-label') as HTMLElement | null;
                const flipHeadingTitle = darkPanelRef.current.querySelector('.flip-heading-title') as HTMLElement | null;
                const flipHeadingSub = darkPanelRef.current.querySelector('.flip-heading-sub') as HTMLElement | null;
                // Only hide the wrapper — children must NOT have opacity:0 so typewriter text is visible
                if (flipHeading) gsap.set(flipHeading, { opacity: 0, y: 0 });

                // Timeline:
                // t 0→2     box expands to fullscreen
                // t 2→4.2   cards fly up (stagger 0.3 each)
                // t 4.5→6   heading fades in at center
                // t 6.5→7.5 heading slides up to top
                // t 7.5→9.5 flip cards stagger in
                // t 9.5→11  hold then unpin
                const pinDuration = 11 * 520;

                // These will be defined below and called from onUpdate
                let twDone = false;
                function runTypewriter() {
                    twDone = true;
                    const labelEl = darkPanelRef.current?.querySelector('.flip-heading-label') as HTMLElement | null;
                    const titleEl = darkPanelRef.current?.querySelector('.flip-heading-title') as HTMLElement | null;
                    const subEl = darkPanelRef.current?.querySelector('.flip-heading-sub') as HTMLElement | null;
                    if (!labelEl) return;

                    const SPEED = 40;
                    const PAUSE = 200;
                    function makeCaret() {
                        const c = document.createElement('span');
                        c.style.cssText = 'display:inline-block;width:2px;height:.85em;background:#1A56FF;margin-left:2px;vertical-align:middle;border-radius:1px;animation:twBlink .75s step-end infinite;';
                        return c;
                    }
                    function typeInto(el: HTMLElement, text: string, onDone: () => void) {
                        el.textContent = '';
                        let i = 0;
                        const caret = makeCaret();
                        el.appendChild(caret);
                        function tick() {
                            if (i < text.length) {
                                el.insertBefore(document.createTextNode(text[i]), caret);
                                i++; setTimeout(tick, SPEED);
                            } else { caret.remove(); setTimeout(onDone, PAUSE); }
                        }
                        tick();
                    }

                    typeInto(labelEl, 'Why DocChain', () => {
                        if (!titleEl) return;
                        titleEl.innerHTML = '';
                        const line1 = document.createElement('span');
                        const br = document.createElement('br');
                        const line2 = document.createElement('span');
                        const caret = makeCaret();
                        titleEl.append(line1, br, line2, caret);
                        const parts = ['For every use case'];
                        let wi = 0, ci = 0;
                        function tickTitle() {
                            const target = wi === 0 ? line1 : line2;
                            const text = parts[wi];
                            if (ci < text.length) {
                                target.append(text[ci]); ci++;
                                setTimeout(tickTitle, SPEED);
                            } else if (wi < parts.length - 1) {
                                wi++; ci = 0; setTimeout(tickTitle, PAUSE / 2);
                            } else {
                                caret.remove();
                                if (subEl) setTimeout(() => typeInto(subEl, 'Hover each card to see how DocChain handles it.', () => { }), PAUSE);
                            }
                        }
                        tickTitle();
                    });
                }

                function resetTypewriter() {
                    twDone = false;
                    const labelEl = darkPanelRef.current?.querySelector('.flip-heading-label') as HTMLElement | null;
                    const titleEl = darkPanelRef.current?.querySelector('.flip-heading-title') as HTMLElement | null;
                    const subEl = darkPanelRef.current?.querySelector('.flip-heading-sub') as HTMLElement | null;
                    if (labelEl) labelEl.textContent = '';
                    if (titleEl) titleEl.innerHTML = '';
                    if (subEl) subEl.textContent = '';
                }

                const TW_THRESHOLD = 4.5 / 11;

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: howItWorksWrapRef.current,
                        start: 'top top',
                        end: () => `+=${pinDuration}`,
                        scrub: 1.2,
                        pin: true,
                        anticipatePin: 1,
                        onUpdate: (self) => {
                            if (self.progress >= TW_THRESHOLD && !twDone) runTypewriter();
                            if (self.progress < TW_THRESHOLD - 0.02 && twDone) resetTypewriter();
                        },
                    }
                });

                // Phase 1: box expands (t=0..2)
                tl.to('.hiw-heading', { opacity: 0, y: -20, duration: 0.8, ease: 'power2.in' }, 0);
                tl.to(darkPanelRef.current, {
                    width: vw, height: vh, borderRadius: 0,
                    duration: 2, ease: 'power2.inOut',
                }, 0);

                // Phase 2: cards fly up one by one (t=2..4.2)
                cards.forEach((card, i) => {
                    tl.to(card, {
                        y: -(vh * 1.2),
                        rotate: (i - 1) * 22,
                        scale: 1.08,
                        opacity: 0,
                        duration: 1.5,
                        ease: 'power3.in',
                    }, 2.0 + i * 0.4);
                });

                // Phase 3: heading container fades in at t=4.5 (typewriter fires via onUpdate in ST config above)
                if (flipHeading) tl.to(flipHeading, { opacity: 1, duration: 0.1, ease: 'none' }, 4.5);

                // Phase 4: heading slides up to top of screen (t=6.5..7.5)
                if (flipHeading) {
                    tl.to(flipHeading, {
                        y: -(vh * 0.28),
                        duration: 1,
                        ease: 'power2.inOut',
                    }, 6.5);
                }

                // Phase 5: flip cards stagger in from below (t=7.5..9.5)
                if (flipRef.current) {
                    tl.to(flipRef.current.querySelectorAll('.flip-card'), {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        stagger: { amount: 0.9, from: 'start' },
                        duration: 0.7,
                        ease: 'power3.out',
                    }, 7.5);
                }

                // Phase 6: hold (t=9.5..11)
                tl.to({}, { duration: 1.5 }, 9.5);
            }
            if (ctaSectionRef.current) {
                gsap.from(ctaSectionRef.current, {
                    opacity: 0, y: 50, scale: 0.97, duration: 0.8, ease: 'power3.out',
                    scrollTrigger: { trigger: ctaSectionRef.current, start: 'top 85%' },
                });
            }

            // Why section pinned scrub
            if (whyRef.current && whyPanelRef.current) {
                const panels = whyRef.current.querySelectorAll('.why-item');
                panels.forEach((panel, i) => {
                    gsap.from(panel, {
                        opacity: 0, x: -40,
                        duration: 0.7, ease: 'power3.out',
                        scrollTrigger: { trigger: panel, start: 'top 75%' },
                    });
                });
                // Animate the right mockup panel lines
                gsap.from(whyPanelRef.current.querySelectorAll('.why-line'), {
                    scaleX: 0, transformOrigin: 'left center',
                    stagger: 0.08, duration: 0.6, ease: 'power2.out',
                    scrollTrigger: { trigger: whyPanelRef.current, start: 'top 70%' },
                });
            }
        });
        return () => ctx.revert();
    }, []);

    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
        gsap.to(el, { rotateX: y, rotateY: x, duration: 0.3, ease: 'power2.out', transformPerspective: 600 });
    };
    const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'elastic.out(1,0.5)' });
    };

    return (
        <div className="min-h-screen bg-[#F7F5F0]">
            <style>{`@keyframes twBlink { 50% { opacity: 0; } } @keyframes scrollDown { 0%{top:-100%} 100%{top:100%} }`}</style>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div id="pl-circle" className="absolute will-change-transform"
                    style={{ width: 700, height: 700, borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1 }} />
                <div className="absolute inset-0 z-[2]"
                    style={{ backgroundImage: 'linear-gradient(rgba(13,13,13,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,13,13,.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div id="pl-ring" className="absolute will-change-transform z-[3]"
                    style={{ width: 180, height: 180, border: '2px solid rgba(26,86,255,.15)', borderRadius: '50%', top: '12%', left: '7%' }} />
                <div id="pl-rect" className="absolute will-change-transform z-[3]"
                    style={{ width: 76, height: 76, border: '1.5px solid rgba(26,86,255,.2)', borderRadius: 14, top: '14%', right: '11%', transform: 'rotate(20deg)' }} />
                <div id="pl-dots" className="absolute will-change-transform z-[3] grid gap-2.5 opacity-20"
                    style={{ gridTemplateColumns: 'repeat(5,1fr)', top: '70%', left: '5%' }}>
                    {Array.from({ length: 15 }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-[#121317]" />))}
                </div>
                <div id="pl-arc" className="absolute will-change-transform z-[3]"
                    style={{ width: 220, height: 110, border: '1.5px solid rgba(26,86,255,.12)', borderBottom: 'none', borderRadius: '110px 110px 0 0', bottom: '10%', left: '14%' }} />
                <div id="pl-line" className="absolute will-change-transform z-[3]"
                    style={{ width: 120, height: 1.5, background: 'linear-gradient(90deg,#1A56FF,transparent)', top: '77%', right: '8%', opacity: .4 }} />

                {/* Floating doc cards */}
                <div id="pl-card1" className="absolute will-change-transform z-[4] bg-white rounded-xl p-4"
                    style={{ width: 155, top: '18%', left: '5%', transform: 'rotate(-4deg)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
                    onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                    <p className="text-[15px] font-bold tracking-widest uppercase text-[#1A56FF] mb-2">Research Paper</p>
                    <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '90%' }} />
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '70%' }} />
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '80%' }} />
                    </div>
                    <div className="mt-2.5 text-xs font-medium text-[#121317]"><span className="text-[10px] text-[#1A56FF] mr-0.5">Ξ</span>0.05</div>
                    <div className="absolute -top-2 -right-2 bg-[#0ACF83] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">FOR SALE</div>
                </div>

                <div id="pl-card2" className="absolute will-change-transform z-[4] bg-white rounded-xl p-4"
                    style={{ width: 140, top: '20%', right: '6%', transform: 'rotate(5deg)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
                    onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                    <p className="text-[15px] font-bold tracking-widest uppercase text-[#1A56FF] mb-2">Legal Agreement</p>
                    <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '85%' }} />
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '60%' }} />
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E8E4DC] text-[#666]">Private</span>
                    </div>
                </div>

                <div id="pl-card3" className="absolute will-change-transform z-[4] bg-white rounded-xl p-4"
                    style={{ width: 148, bottom: '20%', right: '8%', transform: 'rotate(-3deg)', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
                    onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave}>
                    <p className="text-[15px] font-bold tracking-widest uppercase text-[#1A56FF] mb-2">Certificate</p>
                    <div className="flex flex-col gap-1.5">
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '95%' }} />
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '75%' }} />
                        <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '55%' }} />
                    </div>
                    <div className="mt-2.5 text-xs font-medium text-[#121317]"><span className="text-[10px] text-[#1A56FF] mr-0.5">Ξ</span>0.03</div>
                    <div className="absolute -top-2 -right-2 bg-[#FF4D1C] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">SOLD</div>
                </div>

                {/* Hero text */}
                <div className="relative z-[5] text-center max-w-3xl mx-auto px-6">
                    <div ref={pillRef} className="inline-flex items-center gap-2 bg-white border border-[#E8E4DC] px-3 py-1.5 rounded-full text-xs text-[#666] mb-7 shadow-sm" style={{ opacity: 0 }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0ACF83] shadow-[0_0_0_3px_rgba(10,207,131,.2)]" />
                        Powered by Oasis Sapphire
                    </div>
                    <h1 ref={titleRef} className="font-heading font-bold text-[#121317] mb-6"
                        style={{ fontSize: 'clamp(52px,6.5vw,82px)', lineHeight: 1.06, letterSpacing: '-2px', minHeight: '3.2em' }} />
                    <p ref={subRef} className="text-[#666] text-base font-light leading-relaxed max-w-md mx-auto mb-9"
                        style={{ opacity: 0, transform: 'translateY(16px)' }}>
                        The decentralized document hub. Upload anything, prove ownership on-chain, share with anyone, or sell to the world.
                    </p>
                    <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-3"
                        style={{ opacity: 0, transform: 'translateY(12px)' }}>
                        <button onClick={handleStart} className="group flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#121317] text-white text-sm font-medium hover:bg-[#1A56FF] transition-all duration-200">
                            Connect Wallet & Start
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => navigate('/market')} className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E8E4DC] text-[#121317] text-sm font-medium hover:bg-[#ddd] transition-all duration-200">
                            <Search className="w-4 h-4" />
                            Explore Marketplace
                        </button>
                    </div>
                    {/* <div ref={statsRef} className="mt-16 flex flex-wrap justify-center gap-10" style={{ opacity: 0, transform: 'translateY(12px)' }}>
                        {stats.map((s, i) => (
                            <div key={i} className="text-center">
                                <p className="font-heading text-3xl font-bold text-[#1A56FF]">{s.value}</p>
                                <p className="text-xs text-[#45474D] mt-1 tracking-wide">{s.label}</p>
                            </div>
                        ))}
                    </div> */}
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <span className="text-[10px] tracking-[2px] uppercase text-[#45474D]">scroll</span>
                    <div className="w-px h-10 bg-[#E8E4DC] relative overflow-hidden">
                        <div className="absolute top-[-100%] w-full h-full bg-[#121317]" style={{ animation: 'scrollDown 1.5s ease infinite' }} />
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── 
            <section className="py-28">
                <div className="max-w-6xl mx-auto px-4 sm:px-8">
                    <div className="text-center mb-16">
                        <p className="text-xs font-medium tracking-[2px] uppercase text-[#1A56FF] mb-4">Features</p>
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#121317] tracking-tight mb-4">Everything your docs need</h2>
                        <p className="text-[#45474D] max-w-lg mx-auto text-sm leading-relaxed">One platform to store, protect, share, and monetize any document — backed by blockchain permanence.</p>
                    </div>
                    <div ref={featuresRef} className="grid md:grid-cols-3 gap-px bg-[#E8E4DC] rounded-2xl overflow-hidden">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card group bg-white p-9 hover:bg-[#121317] transition-colors duration-200">
                                <div className="w-11 h-11 rounded-xl bg-[#F7F5F0] flex items-center justify-center text-[#1A56FF] mb-5 group-hover:bg-[#1A56FF] group-hover:text-white transition-colors">{f.icon}</div>
                                <h3 className="font-heading text-lg font-bold text-[#121317] mb-3 group-hover:text-white tracking-tight transition-colors">{f.title}</h3>
                                <p className="text-[#45474D] text-sm leading-relaxed group-hover:text-[#aaa] transition-colors">{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>*/}

            {/* ── HOW IT WORKS — Rounded box expand to fullscreen ── */}
            <section
                ref={howItWorksWrapRef}
                className="relative h-screen overflow-hidden bg-[#F7F5F0]"
            >
                {/* Heading — visible before box expands, fades as box grows */}
                <div className="hiw-heading absolute top-16 left-1/2 -translate-x-1/2 text-center z-20 w-full px-4 pointer-events-none">
                    <p className="text-2xs font-bold tracking-[2px] uppercase text-[#1A56FF] mb-3">How it works</p>
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold letterSpacing: '-2.5px' text-[#121317] ">
                        Three steps. Forever yours.
                    </h2>
                </div>

                {/* Dark box — starts as small rounded rect, GSAP expands it to full viewport */}
                <div
                    ref={darkPanelRef}
                    className="z-10 flex items-center justify-center overflow-hidden"
                    style={{
                        background: '#121317',
                        position: 'absolute',
                        willChange: 'width, height, border-radius',
                    }}
                >
                    {/* Background grid inside dark box */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                    {/* Card stack */}
                    <div ref={cardStackRef} className="relative flex items-center justify-center w-full z-10" style={{ perspective: '1200px' }}>
                        <div className="relative" style={{ width: 520, height: 340 }}>
                            {[
                                {
                                    step: '03', bg: '#1A56FF',
                                    icon: <ShoppingBag className="w-10 h-10 text-white" />,
                                    title: 'Store, share or sell',
                                    description: 'Keep it private, share with specific wallets, or list it on the marketplace for anyone to buy.',
                                    tag: 'Final step',
                                },
                                {
                                    step: '02', bg: '#0ACF83',
                                    icon: <Shield className="w-10 h-10 text-white" />,
                                    title: 'Mint as NFT',
                                    description: 'Your document hash is recorded on-chain — immutable proof of ownership and timestamp.',
                                    tag: 'On-chain',
                                },
                                {
                                    step: '01', bg: '#FF4D1C',
                                    icon: <Upload className="w-10 h-10 text-white" />,
                                    title: 'Upload your file',
                                    description: 'Drag and drop any document. We compute its SHA-256 hash instantly in your browser.',
                                    tag: 'Start here',
                                },
                            ].map((card, i) => (
                                <div
                                    key={i}
                                    className="stack-card absolute inset-0 rounded-3xl p-10 flex flex-col justify-between shadow-2xl"
                                    style={{ background: card.bg, willChange: 'transform, opacity' }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                                            {card.icon}
                                        </div>
                                        <span className="text-[11px] font-bold tracking-[2px] uppercase text-white/60 bg-white/10 px-4 py-1.5 rounded-full">
                                            {card.tag}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-3 mb-3">
                                            <span className="font-heading text-6xl font-black text-white/20 leading-none">{card.step}</span>
                                            <h3 className="font-heading text-3xl font-bold text-white leading-tight">{card.title}</h3>
                                        </div>
                                        <p className="text-white/70 text-lg leading-relaxed">{card.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Scroll hint */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 hiw-scroll-hint">
                        <span className="text-[10px] tracking-[2px] uppercase text-white/30">scroll through</span>
                        <div className="w-px h-8 bg-white/10 relative overflow-hidden">
                            <div className="absolute top-[-100%] w-full h-full bg-white/40" style={{ animation: 'scrollDown 1.5s ease infinite' }} />
                        </div>
                    </div>

                    {/* Heading — typewriter, then slides up — triggered by ScrollTrigger onEnter */}
                    <div className="flip-heading absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none" style={{ opacity: 0 }}>
                        <p className="flip-heading-label text-3xs font-bold tracking-[2px] uppercase text-[#1A56FF] mb-3"></p>
                        <h2 className="flip-heading-title font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight text-center leading-tight"></h2>
                        <p className="flip-heading-sub text-white/50 text-sm mt-4"></p>
                    </div>

                    {/* Flip grid — slides in after heading moves up */}
                    <div
                        ref={flipRef}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-end px-8 pb-28"
                        style={{ perspective: '1200px', pointerEvents: 'none' }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl" style={{ pointerEvents: 'auto' }}>
                            {[
                                {
                                    icon: <Lock className="w-6 h-6" />, color: '#1A56FF',
                                    frontTitle: 'Private Contracts',
                                    frontSub: 'Keep sensitive docs encrypted, accessible only by wallet.',
                                    backTitle: 'How it works',
                                    backBody: "Your document is encrypted before upload. Only wallets you explicitly grant can decrypt and view it — even we can't read it.",
                                },
                                {
                                    icon: <Globe className="w-6 h-6" />, color: '#0ACF83',
                                    frontTitle: 'Public Publishing',
                                    frontSub: 'Release research, whitepapers, or open-source docs to the world.',
                                    backTitle: 'How it works',
                                    backBody: "Set visibility to public when minting. Anyone can verify authenticity via the document's on-chain hash — no middleman needed.",
                                },
                                {
                                    icon: <ShoppingBag className="w-6 h-6" />, color: '#FF4D1C',
                                    frontTitle: 'Sell & Monetize',
                                    frontSub: 'Set a price. Buyers pay in crypto, get instant access.',
                                    backTitle: 'How it works',
                                    backBody: 'List any document for sale in the marketplace. Smart contracts handle payment and access atomically — funds release only when the buyer receives access.',
                                },
                                {
                                    icon: <Shield className="w-6 h-6" />, color: '#7C3AED',
                                    frontTitle: 'Tamper Detection',
                                    frontSub: 'Instantly verify if a document has been altered.',
                                    backTitle: 'How it works',
                                    backBody: "Every document's SHA-256 hash is stored on-chain at upload time. Re-hashing later and comparing catches any modification, byte by byte.",
                                },
                                {
                                    icon: <Star className="w-6 h-6" />, color: '#F59E0B',
                                    frontTitle: 'Proof of Authorship',
                                    frontSub: 'Prove you created something first, forever.',
                                    backTitle: 'How it works',
                                    backBody: "The block timestamp becomes your immutable timestamp. Combined with your wallet signature, it's court-admissible proof you authored the document.",
                                },
                                {
                                    icon: <Clock className="w-6 h-6" />, color: '#0EA5E9',
                                    frontTitle: 'Version History',
                                    frontSub: 'Track every revision of a document on-chain.',
                                    backTitle: 'How it works',
                                    backBody: 'Each new version is a new NFT linked to the original. The entire revision tree is public and auditable — perfect for legal or compliance workflows.',
                                },
                            ].map((card, i) => (
                                <div key={i} className="flip-card h-48 cursor-pointer" style={{ perspective: '1000px' }}>
                                    <div className="flip-card-inner relative w-full h-full">
                                        {/* Front */}
                                        <div className="flip-face absolute inset-0 rounded-2xl border border-white/10 p-6 flex flex-col justify-between" style={{ background: card.color }}>
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                                                style={{ background: card.color }}>
                                                {card.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-heading text-2sm font-bold text-white mb-1.5">{card.frontTitle}</h3>
                                                <p className="text-white/50 text-base leading-relaxed ">{card.frontSub}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: card.color }}>
                                                HOVER TO LEARN MORE <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                        {/* Back */}
                                        <div className="flip-face flip-back absolute inset-0 rounded-2xl p-6 flex flex-col justify-between text-white"
                                            style={{ background: card.color }}>
                                            <p className="text-[10px] font-bold uppercase opacity-70">{card.backTitle}</p>
                                            <p className="text-sm leading-relaxed opacity-90">{card.backBody}</p>
                                            <div className="h-px bg-white opacity-20" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MARKETPLACE TEASER ── 
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-8">
                    <div className="text-center mb-12">
                        <p className="text-xs font-medium tracking-[2px] uppercase text-[#1A56FF] mb-4">Marketplace</p>
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#121317] tracking-tight mb-4">Buy & sell verified docs</h2>
                        <p className="text-[#45474D] max-w-lg mx-auto text-sm leading-relaxed">Every listing is a blockchain-verified document. Buy with confidence — what you see is what you own.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { type: 'Research Paper', price: '0.08', badge: 'New', badgeColor: '#1A56FF' },
                            { type: 'Legal Template', price: '0.12', badge: 'Hot', badgeColor: '#FF4D1C' },
                            { type: 'Course Notes', price: '0.03', badge: null, badgeColor: '' },
                            { type: 'Patent Draft', price: '0.25', badge: 'Rare', badgeColor: '#0ACF83' },
                        ].map((doc, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-[#E8E4DC] p-5 hover:shadow-md hover:border-[#1A56FF]/30 transition-all duration-200 cursor-pointer group relative">
                                {doc.badge && (<div className="absolute -top-2 -right-2 text-white text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: doc.badgeColor }}>{doc.badge}</div>)}
                                <div className="w-10 h-10 rounded-lg bg-[#F7F5F0] flex items-center justify-center mb-3 group-hover:bg-[#1A56FF]/10 transition-colors"><Zap className="w-4 h-4 text-[#1A56FF]" /></div>
                                <p className="text-xs font-medium text-[#121317] mb-1">{doc.type}</p>
                                <div className="flex flex-col gap-1 mb-3">
                                    <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '90%' }} />
                                    <div className="h-1.5 rounded bg-[#E8E4DC]" style={{ width: '65%' }} />
                                </div>
                                <p className="text-sm font-bold text-[#1A56FF]"><span className="text-xs mr-0.5">Ξ</span>{doc.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
                


            {/* ── WHY DOCCHAIN split scroll ── */}
            <section className="bg-[#0C0E12] overflow-hidden">
                <style>{`
                    .why-row { border-top: 1px solid rgba(255,255,255,0.07); }
                    .why-row:last-child { border-bottom: 1px solid rgba(255,255,255,0.07); }
                    .why-arrow { transition: transform 0.25s ease; display:inline-block; }
                    .why-row:hover .why-arrow { transform: translate(4px,-4px); }
                    .why-tag { display:inline-flex;align-items:center;padding:4px 10px;border-radius:99px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase; }
                `}</style>

                {/* Top label bar */}
                <div className="border-b border-white/[0.07] px-8 sm:px-16 py-5 flex items-center justify-between">
                    <span className="text-[13px] tracking-[3px] uppercase text-white font-medium">The difference</span>
                    <span className="text-[13px] tracking-[3px] uppercase text-white font-mono">03 reasons</span>
                </div>

                <div ref={whyRef} className="grid md:grid-cols-[1fr_1.15fr]">

                    {/* Left — sticky editorial heading */}
                    <div className="md:sticky md:top-0 md:h-screen flex flex-col justify-between px-8 sm:px-16 py-16 border-r border-white/[0.07]">
                        <div>
                            <h2 className="why-heading-title font-heading text-[clamp(2.6rem,5.5vw,4.8rem)] font-black text-white leading-[0.93] tracking-tight">
                                <span className="why-heading-line">Not just </span>
                                <span className="why-heading-line" style={{
                                    transitionDelay: '0.12s',
                                    backgroundImage: 'linear-gradient(100deg,#7C3AED 30%,#A855F7)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    paddingRight: '4px',
                                }}>storage.</span>
                                <span className="why-heading-line" style={{
                                    transitionDelay: '0.24s',
                                    backgroundImage: 'linear-gradient(100deg,#1A56FF 30%,#0ACF83)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    paddingRight: '4px',
                                }}> Owner­ship.</span>
                            </h2>
                        </div>

                        <div>
                            <p className="why-item text-white/45 text-sm leading-relaxed max-w-[260px] mb-10">
                                Cloud platforms can revoke access overnight. DocChain anchors your documents to the blockchain — permanently, immutably yours.
                            </p>
                            {/* Crossed-out competitors */}
                            <div className="why-item flex flex-col gap-2.5">
                                {['Google Drive', 'Dropbox', 'Email', 'Notary'].map((name, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-white/[0.06]" />
                                        <span className="text-[11px] text-white/45 font-medium tracking-wide line-through decoration-white/15">{name}</span>
                                        <div className="h-px flex-1 bg-white/[0.06]" />
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="h-px flex-1 bg-[#1A56FF]/50" />
                                    <span className="text-[10px] text-[#1A56FF] font-black tracking-[3px] uppercase">DocChain</span>
                                    <div className="h-px flex-1 bg-[#1A56FF]/50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right — 3 feature rows */}
                    <div ref={whyPanelRef} className="flex flex-col">
                        {[
                            {
                                num: '01', tag: 'Ownership', tagColor: '#1A56FF',
                                title: 'Your wallet.\nYour files.',
                                body: 'No company controls your documents. Your private key is the only access credential — deletion-proof, seizure-resistant, permanent.',
                                stat: '∞', statLabel: 'years on-chain',
                            },
                            {
                                num: '02', tag: 'Verification', tagColor: '#0ACF83',
                                title: 'Notarized in\nseconds.',
                                body: 'Every document gets a SHA-256 hash written to the blockchain at mint. Tamper-proof timestamp. Costs cents. Valid in 190+ countries.',
                                stat: '<1s', statLabel: 'to notarize',
                            },
                            {
                                num: '03', tag: 'Monetization', tagColor: '#F59E0B',
                                title: 'Sell access.\nNot copies.',
                                body: 'Smart contracts gate decryption behind payment. Buyers get instant access; you keep control. Every resale triggers your royalty.',
                                stat: '0%', statLabel: 'platform cut',
                            },
                        ].map((row, i) => (
                            <div key={i} className="why-row why-item group px-8 sm:px-14 py-14 flex flex-col gap-6 cursor-default">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[12px] font-mono text-white">{row.num}</span>
                                        <span className="why-tag" style={{ background: row.tagColor + '18', color: row.tagColor, border: `1px solid ${row.tagColor}30` }}>
                                            {row.tag}
                                        </span>
                                    </div>
                                    <span className="why-arrow text-white text-base">↗</span>
                                </div>

                                <h3 className="font-heading text-[clamp(1.8rem,3.2vw,2.6rem)] font-black text-white leading-[1.0] tracking-tight" style={{ whiteSpace: 'pre-line' }}>
                                    {row.title}
                                </h3>

                                <p className="text-white text-sm leading-relaxed max-w-xs">{row.body}</p>

                                <div className="flex items-end gap-2 pt-1">
                                    <span className="why-stat-num font-heading text-[2.6rem] font-black leading-none" data-value={row.stat} style={{ color: row.tagColor }}>{row.stat}</span>
                                    <span className="text-white/50 text-[10px] mb-1 tracking-[2px] uppercase font-medium">{row.statLabel}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-28 px-4">
                <div ref={ctaSectionRef} className="max-w-4xl mx-auto text-center bg-[#121317] rounded-3xl py-20 px-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <div className="relative z-10">
                        <p className="text-xs font-medium tracking-[2px] uppercase text-[#1A56FF] mb-4">Get started</p>
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight mb-5">Your documents deserve<br />a permanent home.</h2>
                        <p className="text-[#45474D] text-base mb-10 max-w-xl mx-auto leading-relaxed">Join thousands of creators, researchers, and businesses who trust DocChain for tamper-proof document management.</p>
                        <button onClick={handleStart} className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#1A56FF] text-white font-heading font-bold text-base hover:bg-blue-500 transition-all duration-200">
                            Launch App <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── MARQUEE TRUST BAR ── */}
            <section className="py-8 overflow-hidden bg-[#121317]">
                <style>{`
                    @keyframes marquee-ltr { from { transform: translateX(-50%) } to { transform: translateX(0%) } }
                    @keyframes marquee-rtl { from { transform: translateX(0%) } to { transform: translateX(-50%) } }
                    .mq-ltr { animation: marquee-ltr 32s linear infinite; }
                    .mq-rtl { animation: marquee-rtl 28s linear infinite; }
                    .mq-ltr:hover, .mq-rtl:hover { animation-play-state: paused; }
                    .flip-card-inner { transition: transform 0.65s cubic-bezier(.4,0,.2,1); transform-style: preserve-3d; }
                    .flip-card:hover .flip-card-inner { transform: rotateY(180deg); }
                    .flip-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                    .flip-back { transform: rotateY(180deg); }
                `}</style>
                {/* ── SCOREBOARD MARQUEE ── */}
                <section className="overflow-hidden bg-[#121317]">
                    <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .ticker-track { animation: ticker 32s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
    `}</style>

                    <div className="overflow-hidden h-10 flex items-stretch">
                        <div className="ticker-track flex items-stretch w-max">
                            {[
                                { text: 'SHA-256 HASHING / ON-CHAIN PROOF / NFT OWNERSHIP /' },
                                { text: 'ENCRYPTED STORAGE / INSTANT VERIFICATION / DECENTRALIZED /' },
                                { text: 'OASIS SAPPHIRE / ZERO-KNOWLEDGE / SMART CONTRACTS /' },
                                { text: 'SHA-256 HASHING / ON-CHAIN PROOF / NFT OWNERSHIP /' },
                                { text: 'ENCRYPTED STORAGE / INSTANT VERIFICATION / DECENTRALIZED /' },
                                { text: 'OASIS SAPPHIRE / ZERO-KNOWLEDGE / SMART CONTRACTS /' },
                            ].map((item, i) => (
                                <div key={i} className="inline-flex items-stretch flex-shrink-0">

                                    {/* Scrolling text */}
                                    <span className="inline-flex items-center text-white font-bold text-[12px] tracking-[2px] uppercase pl-7 pr-5 whitespace-nowrap">
                                        {item.text}
                                    </span>
                                    <span className="inline-block self-center w-px h-4 bg-white/15 mx-4 flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Row 1 — trái sang phải
                <div className="flex whitespace-nowrap mb-3 overflow-hidden">
                    <div className="mq-ltr flex items-center gap-0">
                        {['SHA-256 Hashing', 'On-chain Proof', 'NFT Ownership', 'Encrypted Storage', 'Instant Verification', 'Decentralized', 'Oasis Sapphire', 'Zero-knowledge',
                            'SHA-256 Hashing', 'On-chain Proof', 'NFT Ownership', 'Encrypted Storage', 'Instant Verification', 'Decentralized', 'Oasis Sapphire', 'Zero-knowledge'].map((label, i) => (
                                <div key={i} className="inline-flex items-center flex-shrink-0">
                                    <span className="text-[11px] font-medium text-white/40 tracking-[1.5px] uppercase px-5">{label}</span>
                                    <span className="w-px h-3 bg-white/10 flex-shrink-0" />
                                </div>
                            ))}
                    </div>
                </div> */}

                {/* Row 2 — phải sang trái, pill style
                <div className="flex whitespace-nowrap overflow-hidden">
                    <div className="mq-rtl flex items-center gap-3 px-3">
                        {['Smart Contracts', 'Immutable Records', 'Wallet Auth', 'Version Control', 'Access Grants', 'Document NFTs', 'Tamper Detection', 'Permanent Storage',
                            'Smart Contracts', 'Immutable Records', 'Wallet Auth', 'Version Control', 'Access Grants', 'Document NFTs', 'Tamper Detection', 'Permanent Storage'].map((label, i) => (
                                <span key={i} className="flex-shrink-0 text-[10px] font-semibold tracking-[1px] uppercase px-4 py-1.5 rounded-full border border-white/10 text-white/30 bg-white/[0.03]">
                                    {label}
                                </span>
                            ))}
                    </div>
                </div> */}
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-8 border-t border-[#E8E4DC]">
                <div className="max-w-6xl mx-auto px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-[#121317] flex items-center justify-center"><span className="text-white text-[9px] font-bold">D</span></div>
                            <span className="font-heading text-sm font-bold text-[#121317]">Doc<span className="text-[#1A56FF]">Chain</span></span>
                        </div>
                        <p className="text-[#45474D] text-xs">© 2024 DocChain. Built on Oasis Sapphire.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;