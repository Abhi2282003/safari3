import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, ClipboardList, Save, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStaffMember } from '@/hooks/useStaffMember';
import { useTravels } from '@/hooks/useTickets';

export default function TicketEntry() {
  const navigate = useNavigate();
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
  const [recent, setRecent] = useState<{ ticket_no: string; travels_name: string; amount: number }[]>([]);

  useEffect(() => {
    if (isStaff && staff?.full_name) setBookedBy(staff.full_name);
  }, [isStaff, staff]);

  const loadRecent = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('pay_collection_entries')
      .select('ticket_no, travels_name, amount, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setRecent((data || []) as any);
  };

  useEffect(() => { loadRecent(); }, [user]);

  const reset = () => {
    setTicketNo('');
    setTravelsName('');
    setToursTo('');
    setBookedBy(isStaff && staff?.full_name ? staff.full_name : '');
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
    toast.success('Ticket entry saved');
    reset();
    loadRecent();
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Ticket Entry</h1>
            <p className="text-sm text-muted-foreground">Add a new ticket to collection</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/pay-collection')} className="gap-2">
              <Wallet className="h-4 w-4" /> Pay Collection
            </Button>
            <Button variant="outline" onClick={() => navigate('/hisab')} className="gap-2">
              <ClipboardList className="h-4 w-4" /> Hisab
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />New Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ticket No *</Label>
                <Input value={ticketNo} onChange={e => setTicketNo(e.target.value)} placeholder="Enter ticket number" />
              </div>
              <div className="space-y-1.5">
                <Label>Travels *</Label>
                <Select value={travelsName} onValueChange={setTravelsName}>
                  <SelectTrigger><SelectValue placeholder="Select travels" /></SelectTrigger>
                  <SelectContent>
                    {travels.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Destination</Label>
                <Input value={toursTo} onChange={e => setToursTo(e.target.value)} placeholder="e.g. Mumbai" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Booked By</Label>
                <Input value={bookedBy} onChange={e => setBookedBy(e.target.value)} readOnly={isStaff} className={isStaff ? 'bg-muted' : ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode *</Label>
                <Select value={entryMode} onValueChange={v => setEntryMode(v as 'Cash' | 'Online')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={reset}>Clear</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {recent.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent entries</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {recent.map((r, i) => (
                  <div key={i} className="flex justify-between border-b pb-1 last:border-0">
                    <span className="font-mono text-xs">{r.ticket_no}</span>
                    <span className="truncate px-2 text-muted-foreground">{r.travels_name}</span>
                    <span>₹{Number(r.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
