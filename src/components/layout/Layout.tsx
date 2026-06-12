import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bus, Wallet, ClipboardList, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import companyLogo from '@/assets/royal-safari-logo.png';

interface LayoutProps {
  children: ReactNode;
}

function StaffTopNav() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
  };

  const openTicketEntry = () => {
    navigate('/ticket-entry');
  };

  const NavBtn = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const active = location.pathname === to;
    return (
      <Link to={to}>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="sm"
          className="gap-1.5"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
            <Bus className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-semibold truncate hidden sm:inline">Bus Tickets</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Button
            size="sm"
            onClick={openTicketEntry}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Ticket Entry</span>
          </Button>
          <NavBtn to="/pay-collection" icon={Wallet} label="Pay Collection" />
          <NavBtn to="/hisab" icon={ClipboardList} label="Hisab" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Layout({ children }: LayoutProps) {
  const { isStaff } = useUserRole();

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
        <>
          <StaffTopNav />
          <main className="pt-16 min-h-screen relative z-10 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8">
            {children}
          </main>
        </>
      ) : (
        <>
          <Sidebar />
          <main className={cn(
            'pt-18 lg:pt-8 lg:ml-64 min-h-screen relative z-10 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-8'
          )}>
            {children}
          </main>
        </>
      )}
    </div>
  );
}
