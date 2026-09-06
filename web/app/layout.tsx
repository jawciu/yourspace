import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Yourspace', description: 'A house design service whose site assembles itself around what you want to do with your home.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-brand="hearth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;600;700;800&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
