export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'notary-dark': '#0A0E1A',
                'notary-dark-secondary': '#111827',
                'notary-cyan': '#00D4FF',
                'notary-cyan-dim': '#00A3CC',
                'notary-gold': '#F5C842',
                'notary-gold-dim': '#D4A832',
                'notary-slate': '#64748B',
                'notary-slate-dark': '#334155',
                'notary-success': '#10B981',
                'notary-error': '#EF4444',
            },
            fontFamily: {
                'mono': ['"Space Mono"', 'monospace'],
                'heading': ['Syne', 'sans-serif'],
                'body': ['"DM Sans"', 'sans-serif'],
            },
            animation: {
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'scanline': 'scanline 8s linear infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.6)' },
                },
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(189, 100%, 50%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(215, 100%, 50%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(189, 100%, 50%, 0.08) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(215, 100%, 50%, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(189, 100%, 50%, 0.1) 0px, transparent 50%)',
            },
        },
    },
    plugins: [],
};
