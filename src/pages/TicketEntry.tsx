import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, Smartphone, Check, IndianRupee } from 'lucide-react';
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
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0 });

  useEffect(() => {
    if (isStaff && staff?.full_name) setBookedBy(staff.full_name);
  }, [isStaff, staff]);

  const loadStats = async () => {
    if (!user) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data } = await (supabase as any)
      .from('pay_collection_entries')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString());
    const rows = (data || []) as { amount: number }[];
    setTodayStats({
      count: rows.length,
      total: rows.reduce((s, r) => s + Number(r.amount || 0), 0),
    });
  };

  useEffect(() => { loadStats(); }, [user]);

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
    loadStats();
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-4">
        {/* Greeting + today stats */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Ticket</h1>
          <p className="text-sm text-muted-foreground">Add a ticket to today's collection</p>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Today</p>
              <p className="text-2xl font-bold leading-tight">{todayStats.count} <span className="text-sm font-normal text-muted-foreground">tickets</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Collection</p>
              <p className="text-2xl font-bold leading-tight flex items-center justify-end">
                <IndianRupee className="h-5 w-5" />{todayStats.total.toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ticket No</Label>
              <Input
                value={ticketNo}
                onChange={e => setTicketNo(e.target.value)}
                placeholder="e.g. 12345"
                className="h-12 text-base"
                inputMode="text"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Travels</Label>
              <Select value={travelsName} onValueChange={setTravelsName}>
                <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select travels" /></SelectTrigger>
                <SelectContent>
                  {travels.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Destination</Label>
              <Input
                value={toursTo}
                onChange={e => setToursTo(e.target.value)}
                placeholder="e.g. Mumbai"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-12 text-base pl-9 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryMode('Cash')}
                  className={cn(
                    'flex items-center justify-center gap-2 h-12 rounded-md border-2 transition-all font-medium',
                    entryMode === 'Cash'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <Banknote className="h-4 w-4" />
                  Cash
                  {entryMode === 'Cash' && <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('Online')}
                  className={cn(
                    'flex items-center justify-center gap-2 h-12 rounded-md border-2 transition-all font-medium',
                    entryMode === 'Online'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  Online
                  {entryMode === 'Online' && <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isStaff && (
              <div className="text-xs text-muted-foreground pt-1">
                Booked by <span className="font-medium text-foreground">{bookedBy || '—'}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sticky CTA above bottom nav */}
        <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-3 pt-3 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 text-base font-semibold shadow-lg"
            >
              {saving ? 'Saving…' : 'Save Ticket'}
            </Button>
          </div>
        </div>

        {/* Spacer so content doesn't hide behind sticky CTA */}
        <div className="h-20" />
      </div>
    </Layout>
  );
}
