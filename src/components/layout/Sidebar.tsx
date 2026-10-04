import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Bus,
  LogOut,
  Menu,
  Armchair,
  Users,
  TrendingUp,
  Wallet,
  ClipboardList,
  Receipt,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const adminItems = [
  { href: '/', label: 'Today', icon: LayoutDashboard },
  { href: '/seat-bookings', label: 'Book seats', icon: Armchair },
  { href: '/agent-collections', label: 'Agent collections', icon: Users },
  { href: '/admin', label: 'Owner area', icon: Lock, divider: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];


const staffItems = [
  { href: '/pay-collection', label: 'Pay Collection', icon: Wallet },
  { href: '/hisab', label: 'Daily Hisab', icon: ClipboardList },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navItems = isAdmin ? adminItems : staffItems;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          RS
        </div>
        <div>
          <h1 className="font-semibold text-base leading-tight">Royal Safari</h1>
          <p className="text-xs text-muted-foreground">Booking office</p>
        </div>
      </div>

      <nav className="mt-2 px-3 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href === '/admin' && ['/memo', '/owner'].some((p) => location.pathname.startsWith(p)));
            return (
              <li key={item.href} className={(item as any).divider ? 'mt-3 pt-3 border-t border-sidebar-border' : ''}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold uppercase">
            {(user?.email || 'ow').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Staff'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b bg-sidebar px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">RS</div>
          <span className="font-semibold text-sidebar-foreground">Royal Safari</span>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
