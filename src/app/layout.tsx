import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'University Clash-Free Timetable Generator',
  description: 'Automated Timetable Generator powered by CSP Backtracking Algorithm',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
