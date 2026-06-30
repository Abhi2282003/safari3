import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffMember } from '@/hooks/useStaffMember';
import { Button } from '@/components/ui/button';
import { Bus, Wallet, ClipboardList, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import companyLogo from '@/assets/royal-safari-logo.png';

interface LayoutProps {
  children: ReactNode;
}

function StaffShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { staff } = useStaffMember();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  const tabs = [
    { to: '/ticket-entry', icon: Plus, label: 'Entry' },
    { to: '/pay-collection', icon: Wallet, label: 'Collection' },
    { to: '/hisab', icon: ClipboardList, label: 'Hisab' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
              <Bus className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">
                {staff?.full_name || 'Staff'}
              </div>
              <div className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">
                @{staff?.username || '...'}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 px-4 pt-4 relative z-10">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
        <div className="grid grid-cols-3 max-w-md mx-auto">
          {tabs.map(t => {
            const active = location.pathname === t.to;
            const Icon = t.icon;
            return (
              <button
                key={t.to}
                onClick={() => navigate(t.to)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-primary/10' : 'bg-transparent'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const { isStaff, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {isStaff ? (
        <StaffShell>{children}</StaffShell>
      ) : (
        <>
          <Sidebar />
          <main className={cn(
            'pt-20 lg:pt-8 lg:ml-64 min-h-screen relative z-10 px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-8 overflow-x-hidden'
          )}>
            {children}
          </main>
        </>
      )}
    </div>
  );
}
