import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import companyLogo from '@/assets/royal-safari-logo.png';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-5">
        <img 
          src={companyLogo} 
          alt="" 
          className="w-64 h-64 lg:w-96 lg:h-96 object-contain"
        />
      </div>
      
      <Sidebar />
      {/* Add padding-top for mobile header, margin-left for desktop sidebar */}
      <main className="pt-16 lg:pt-6 lg:ml-64 min-h-screen relative z-10 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        {children}
      </main>
    </div>
  );
}