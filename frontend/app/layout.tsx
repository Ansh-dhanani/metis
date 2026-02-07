import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'METIS - AI Recruitment Platform',
    description: 'Intelligent candidate evaluation with AI-powered scoring and live interviews',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <nav className="border-b border-slate-700 px-6 py-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🧠</span>
                            <span className="text-xl font-bold gradient-text">METIS</span>
                        </div>
                        <div className="flex gap-6">
                            <a href="/" className="text-slate-400 hover:text-white transition-colors">
                                Leaderboard
                            </a>
                            <a href="/interview" className="text-slate-400 hover:text-white transition-colors">
                                Interview
                            </a>
                        </div>
                    </div>
                </nav>
                <main className="min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </body>
        </html>
    );
}
