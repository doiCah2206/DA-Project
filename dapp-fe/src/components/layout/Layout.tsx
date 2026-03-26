import type { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-notary-dark">
            {/* Animated background gradient mesh */}
            <div className="fixed inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />

            {/* Grid overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                }}
            />

            <Navbar />

            <main className="relative pt-16">
                {children}
            </main>
        </div>
    );
};

export default Layout;
