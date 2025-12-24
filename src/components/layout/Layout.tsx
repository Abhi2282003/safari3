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
          className="w-96 h-96 object-contain"
        />
      </div>
      
      <Sidebar />
      <main className="ml-64 min-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}