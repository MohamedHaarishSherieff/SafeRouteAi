import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SafeRoute AI | Delhi Road Risk Intelligence & Black Spot Decision System',
  description:
    'AI-based geospatial analytics and civil engineering decision-support platform for identifying accident black spots, diagnosing risk factors, and simulating countermeasure impacts across Delhi NCT.',
  keywords: [
    'Road Safety AI',
    'Delhi Traffic Police',
    'Accident Black Spots',
    'Geospatial Analytics',
    'VisionZero',
    'Smart Cities',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
