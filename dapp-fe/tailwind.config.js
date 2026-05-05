export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'notary-dark': '#F7F5F0',
                'notary-dark-secondary': '#EEEAE2',
                'notary-cyan': '#1A56FF',
                'notary-cyan-dim': '#1244D4',
                'notary-gold': '#FF4D1C',
                'notary-gold-dim': '#D43A0F',
                'notary-slate': '#888888',
                'notary-slate-dark': '#CCCCCC',
                'notary-success': '#0ACF83',
                'notary-error': '#EF4444',
                'ink': '#0D0D0D',
                'ink2': '#666666',
                'soft': '#E8E4DC',
            },
            fontFamily: {
                'mono': ['"Space Mono"', 'monospace'],
                'heading': ['DM Sans', 'sans-serif'],
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
