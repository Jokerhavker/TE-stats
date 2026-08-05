import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
    title: 'TEAM ELITE STATS | Pro Scoring Dashboard',
    description: 'A high-performance real-time esports scoring application for TEAM ELITE Free Fire MAX team.',
    icons: {
        icon: 'https://files.catbox.moe/d6nc0b.jpg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Michroma&family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
