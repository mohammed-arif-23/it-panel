import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: "Unified College App",
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
          html {
            font-family: 'Poppins', sans-serif;
          }
        `}</style>
      </head>
      <body className="bg-white text-black font-['Poppins'] pt-[150px] relative">
        <div className="fixed inset-0 z-[-1] opacity-20">
          <Image 
            src="/bg.jpg" 
            alt="Background" 
            fill 
            priority 
            className="object-cover" 
            quality={50}
          />
        </div>

        <header className="fixed top-0 left-0 w-full  backdrop-blur-sm z-60 flex justify-center items-center py-4">
          <div className="flex flex-col items-center">
            <Image 
              src="/logo.png" 
              alt="Department of IT" 
              width={500} 
              height={150} 
              className="object-contain"
            />
             </div>
        </header>
        
        <AuthProvider>
          <main className="container mx-auto px-4">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
