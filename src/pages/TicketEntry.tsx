import { useEffect, useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Banknote, Smartphone, Check, IndianRupee, ChevronsUpDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStaffMember } from '@/hooks/useStaffMember';
import { useTravels } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

export default function TicketEntry() {
  const { user } = useAuth();
  const { isStaff } = useUserRole();
  const { staff } = useStaffMember();
  const { travels } = useTravels();

  const [ticketNo, setTicketNo] = useState('');
  const [travelsName, setTravelsName] = useState('');
  const [toursTo, setToursTo] = useState('');
  const [bookedBy, setBookedBy] = useState('');
  const [amount, setAmount] = useState('');
  const [entryMode, setEntryMode] = useState<'Cash' | 'Online'>('Cash');
  const [saving, setSaving] = useState(false);
  const [travelsOpen, setTravelsOpen] = useState(false);
  const [travelsSearch, setTravelsSearch] = useState('');

  useEffect(() => {
    if (isStaff && staff?.full_name) setBookedBy(staff.full_name);
  }, [isStaff, staff]);

  const filteredTravels = useMemo(() => {
    const q = travelsSearch.toLowerCase().trim();
    if (!q) return travels;
    return travels.filter(t => t.name.toLowerCase().includes(q));
  }, [travels, travelsSearch]);

  const reset = () => {
    setTicketNo('');
    setTravelsName('');
    setToursTo('');
    setAmount('');
    setEntryMode('Cash');
  };

  const handleSave = async () => {
    if (!user) { toast.error('Not authenticated'); return; }
    if (!ticketNo.trim() || !travelsName || !amount) {
      toast.error('Ticket No, Travels and Amount are required');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from('pay_collection_entries').insert({
      user_id: user.id,
      ticket_no: ticketNo.trim(),
      travels_name: travelsName,
      tours_to: toursTo.trim() || null,
      booked_by: bookedBy.trim() || null,
      amount: Number(amount) || 0,
      collection_status: 'Unpaid',
      entry_payment_mode: entryMode,
    });
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Ticket saved');
    reset();
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-3">
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Ticket No</Label>
              <Input
                value={ticketNo}
                onChange={e => setTicketNo(e.target.value)}
                placeholder="e.g. 12345"
                className="h-10 text-sm"
                inputMode="text"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Travels</Label>
              <Popover open={travelsOpen} onOpenChange={(o) => { setTravelsOpen(o); if (!o) setTravelsSearch(''); }}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <span className={travelsName ? 'truncate' : 'text-muted-foreground'}>
                      {travelsName || 'Select travels'}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={travelsSearch}
                        onChange={(e) => setTravelsSearch(e.target.value)}
                        placeholder="Search travels..."
                        className="h-9 pl-7 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {filteredTravels.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center text-muted-foreground">No travels found</p>
                    ) : (
                      filteredTravels.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTravelsName(t.name);
                            setTravelsOpen(false);
                            setTravelsSearch('');
                          }}
                          className={cn(
                            'flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent text-left',
                            travelsName === t.name && 'bg-accent font-medium'
                          )}
                        >
                          <span className="truncate">{t.name}</span>
                          {travelsName === t.name && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Destination</Label>
              <Input
                value={toursTo}
                onChange={e => setToursTo(e.target.value)}
                placeholder="e.g. Mumbai"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-10 text-sm pl-9 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryMode('Cash')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 h-10 rounded-md border-2 transition-all text-sm font-medium',
                    entryMode === 'Cash'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('Online')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 h-10 rounded-md border-2 transition-all text-sm font-medium',
                    entryMode === 'Online'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  Online
                </button>
              </div>
            </div>

            {isStaff && (
              <div className="text-[11px] text-muted-foreground">
                Booked by <span className="font-medium text-foreground">{bookedBy || '—'}</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-11 text-sm font-semibold"
            >
              {saving ? 'Saving…' : 'Save Ticket'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
