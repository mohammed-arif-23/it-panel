import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { QueryProvider } from '../components/providers/QueryProvider';
import Link from 'next/link'
import { Home, User2 } from 'lucide-react'

export const metadata: Metadata = {
  title: "Department of IT - AVSEC",
  description: "NPTEL Course Tracking and Seminar Booking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          html { font-family: 'Poppins', sans-serif; }
        `}</style>
      </head>
      <body className="text-black font-['Poppins'] pt-[96px] relative" style={{backgroundColor: '#FFFFFF'}}>
        {/* Compact top app bar for mobile */}
        <header className="fixed top-0 left-0 w-full backdrop-blur-md bg-white/90 z-60 flex justify-center items-center py-2">
          <div className="flex flex-col items-center">
            <img 
              src="https://avsec-it.vercel.app/logo.png" 
              alt="A.V.S. Engineering College" 
              width={360} 
              height={300} 
              className="object-contain w-[500px] sm:w-[320px] md:w-[360px]"
            />
          </div>
        </header>
        
        <QueryProvider>
          <AuthProvider>
            <main className="container mx-auto px-4 max-w-7xl">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}