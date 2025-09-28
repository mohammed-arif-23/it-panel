import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
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
      <body className="text-black font-['Poppins'] pt-[110px] relative" style={{backgroundColor: '#FFFFFF'}}>
        {/* Compact top app bar for mobile */}
        <header className="fixed top-0 left-0 w-full backdrop-blur-md bg-white/90 z-60 flex justify-center items-center py-3 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <img 
              src="https://avsec-it.vercel.app/logo.png" 
              alt="A.V.S. Engineering College" 
              width={400} 
              height={120} 
              className="object-contain"
            />
          </div>
        </header>
        
        <AuthProvider>
          <main className="container mx-auto px-4">
            {children}
          </main>
          {/* Sticky bottom nav for mobile only */}
          <nav className="fixed bottom-3 inset-x-0 px-4 md:hidden">
            <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-2 flex items-center justify-around">
              <Link href="/" className="flex flex-col items-center text-gray-700 ripple px-3 py-2 rounded-lg">
                <Home className="h-5 w-5" />
                <span className="text-[10px] mt-1">Home</span>
              </Link>
              <Link href="/profile" className="flex flex-col items-center text-gray-700 ripple px-3 py-2 rounded-lg">
                <User2 className="h-5 w-5" />
                <span className="text-[10px] mt-1">Profile</span>
              </Link>
            </div>
          </nav>
        </AuthProvider>
      </body>
    </html>
  );
}
