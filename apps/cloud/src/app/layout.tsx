import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tally — Agent-era ActivityWatch',
  description:
    'Privacy-first local time tracker with opt-in end-to-end encrypted cloud sync and an API for AI agents.',
  metadataBase: new URL('https://tally.rollersoft.com.au'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="tally">
      <body className="min-h-screen bg-base-100 text-base-content antialiased">
        {children}
      </body>
    </html>
  );
}
