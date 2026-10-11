import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MoSAI — Physics-Driven Food Packaging Optimizer & FSSAI Compliance',
  description: 'Deterministic sub-10ms physics simulation, GAB sorption isotherms, Michaelis-Menten produce kinetics, and Gemini 1.5 Flash grounded FSSAI regulatory compliance audits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
