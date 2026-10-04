import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { unlockOwner, useOwnerUnlock } from '@/lib/ownerLock';

export const OWNER_SECTIONS = [
  { href: '/admin', label: 'Profit' },
  { href: '/memo', label: 'Memo' },
  { href: '/owner/companies', label: 'Companies and buses' },
  { href: '/owner/layouts', label: 'Seat layouts' },
  { href: '/owner/commissions', label: 'Commissions' },
];

export function OwnerNav() {
  const location = useLocation();
  const { lock } = useOwnerUnlock();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 overflow-x-auto">
      {OWNER_SECTIONS.map((s) => (
        <Link
          key={s.href}
          to={s.href}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
            location.pathname === s.href ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted'
          )}
        >
          {s.label}
        </Link>
      ))}
      <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={lock}>
        <Lock className="h-4 w-4" /> Lock now
      </Button>
    </div>
  );
}

export function OwnerGate({ children }: { children: ReactNode }) {
  const { unlocked } = useOwnerUnlock();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  const submit = async () => {
    if (!pw) return;
    setBusy(true);
    const res = await unlockOwner(pw);
    setBusy(false);
    setPw('');
    if (!res.ok) toast.error(res.message);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Owner area</CardTitle>
          <CardDescription>Enter the owner password. It locks again after 10 minutes without activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Owner password"
            onKeyDown={(e) => e.key === 'Enter' && submit()} autoFocus />
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
