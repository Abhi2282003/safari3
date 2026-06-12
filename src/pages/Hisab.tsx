import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { IndianRupee, Receipt, Wallet, TrendingUp, Calendar as CalIcon } from 'lucide-react';

interface PayEntry {
  id: string;
  user_id: string;
  ticket_no: string;
  travels_name: string;
  booked_by: string | null;
  amount: number;
  collection_status: 'Paid' | 'Unpaid';
  paid_by: string | null;
  receiver_name: string | null;
  payment_mode: string | null;
  paid_at: string | null;
  created_at: string;
}

interface StaffRow { user_id: string; username: string; full_name: string; }

export default function Hisab() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('me');
  const [entries, setEntries] = useState<PayEntry[]>([]);
  const [travelsCommission, setTravelsCommission] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase.from('staff_members').select('user_id, username, full_name').eq('active', true);
      if (data) setStaffList(data as StaffRow[]);
    })();
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('travels').select('name, commission_percent');
      if (data) {
        const m: Record<string, number> = {};
        (data as { name: string; commission_percent: number }[]).forEach(t => { m[t.name] = t.commission_percent ?? 0; });
        setTravelsCommission(m);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const start = new Date(date + 'T00:00:00');
      const end = new Date(date + 'T23:59:59.999');
      let query = (supabase as any).from('pay_collection_entries').select('*');
      if (!isAdmin || selectedStaff === 'me') {
        query = query.eq('user_id', user.id);
      } else if (selectedStaff !== 'all') {
        query = query.eq('user_id', selectedStaff);
      }
      const { data } = await query;
      const all = (data || []) as PayEntry[];
      const filtered = all.filter(e => {
        const created = new Date(e.created_at);
        const paid = e.paid_at ? new Date(e.paid_at) : null;
        const inCreated = created >= start && created <= end;
        const inPaid = paid && paid >= start && paid <= end;
        return inCreated || inPaid;
      });
      setEntries(filtered);
      setLoading(false);
    })();
  }, [user, isAdmin, selectedStaff, date]);

  if (roleLoading) return <Layout><div className="p-6">Loading...</div></Layout>;

  const start = new Date(date + 'T00:00:00');
  const end = new Date(date + 'T23:59:59.999');
  const bookedToday = entries.filter(e => {
    const c = new Date(e.created_at);
    return c >= start && c <= end;
  });
  const paidToday = entries.filter(e => e.paid_at && new Date(e.paid_at) >= start && new Date(e.paid_at) <= end);

  const collectionTotal = bookedToday.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paidOutTotal = paidToday.reduce((s, e) => {
    const cp = travelsCommission[e.travels_name] ?? 0;
    return s + (Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100);
  }, 0);
  const cashInHand = collectionTotal - paidOutTotal;

  return (
    <Layout>
      <div className="p-4 lg:p-8 max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Daily Hisab</h1>
            <p className="text-sm text-muted-foreground">End-of-day report</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin && (
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">My own</SelectItem>
                  <SelectItem value="all">All staff combined</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.user_id} value={s.user_id}>{s.full_name} ({s.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <CalIcon className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-44" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4" />Tickets Booked</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bookedToday.length}</div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center"><IndianRupee className="h-3 w-3" />{collectionTotal.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Paid Out to Travels</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center"><IndianRupee className="h-6 w-6" />{paidOutTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div className="text-sm text-muted-foreground mt-1">{paidToday.length} ticket(s) settled</div>
            </CardContent>
          </Card>
          <Card className="border-primary/40">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Cash In Hand</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold flex items-center ${cashInHand >= 0 ? 'text-primary' : 'text-destructive'}`}>
                <IndianRupee className="h-6 w-6" />{cashInHand.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Collection − Paid out</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Tickets booked on {format(start, 'dd MMM yyyy')}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? <div className="text-sm text-muted-foreground">Loading...</div> : bookedToday.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tickets booked.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-2">Ticket No</th><th>Travels</th><th>Booked By</th><th className="text-right">Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bookedToday.map(e => (
                    <tr key={e.id} className="border-b">
                      <td className="py-2 font-mono text-xs">{e.ticket_no}</td>
                      <td>{e.travels_name}</td>
                      <td>{e.booked_by || '-'}</td>
                      <td className="text-right">₹{Number(e.amount).toLocaleString()}</td>
                      <td><span className={e.collection_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}>{e.collection_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Paid out to travels on {format(start, 'dd MMM yyyy')}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {paidToday.length === 0 ? (
              <div className="text-sm text-muted-foreground">No payments made.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr><th className="py-2">Ticket No</th><th>Paid To (Travels)</th><th>Mode</th><th>Receiver</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {paidToday.map(e => {
                    const cp = travelsCommission[e.travels_name] ?? 0;
                    const payable = Number(e.amount || 0) - (Number(e.amount || 0) * cp) / 100;
                    return (
                      <tr key={e.id} className="border-b">
                        <td className="py-2 font-mono text-xs">{e.ticket_no}</td>
                        <td>{e.travels_name}</td>
                        <td>{e.payment_mode || '-'}</td>
                        <td>{e.receiver_name || '-'}</td>
                        <td className="text-right">₹{payable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
