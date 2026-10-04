import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, subDays, parseISO, isToday } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

type Seat = { bus_name: string | null; journey_date: string; seat_number: number; booking_type: string; created_at: string; agents?: { name: string } | null; passenger_name: string | null };
type Lug = { bus_name: string; journey_date: string; quantity: number; party_name: string | null; item_name: string | null; destination: string; created_at: string };
type Pend = { booking_type: string; agent_id: string | null; amount_from_agent: number; journey_date: string; agents?: { name: string } | null };

const TYPE_DOT: Record<string, string> = {
  online: 'bg-blue-500', agent: 'bg-amber-500', self: 'bg-green-600', return: 'bg-indigo-600', sonu: 'bg-pink-400', royal: 'bg-emerald-500', luggage: 'bg-muted-foreground',
};
const TYPE_NAME: Record<string, string> = { online: 'Online', agent: 'Agent', self: 'Self', return: 'Return', sonu: 'Sonu', royal: 'Royal Chintamani', luggage: 'Luggage' };
const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

async function pageAll<T>(build: (from: number, to: number) => any): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error || !data) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [lug, setLug] = useState<Lug[]>([]);
  const [pend, setPend] = useState<Pend[]>([]);
  const [busCompany, setBusCompany] = useState<Record<string, { company: string; berths: number }>>({});
  const [q, setQ] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const weekEnd = format(subDays(new Date(), -7), 'yyyy-MM-dd');

  useEffect(() => {
    (async () => {
      const [s, l, p, b] = await Promise.all([
        pageAll<Seat>((f, t) => supabase.from('seat_bookings').select('bus_name, journey_date, seat_number, booking_type, created_at, passenger_name, agents(name)').gte('journey_date', weekStart).lte('journey_date', weekEnd).range(f, t)),
        pageAll<Lug>((f, t) => supabase.from('luggage_bookings').select('bus_name, journey_date, quantity, party_name, item_name, destination, created_at').gte('journey_date', weekStart).lte('journey_date', weekEnd).range(f, t)),
        pageAll<Pend>((f, t) => supabase.from('seat_bookings').select('booking_type, agent_id, amount_from_agent, journey_date, agents(name)').in('booking_type', ['agent', 'sonu', 'royal']).eq('agent_collection_status', 'pending').range(f, t)),
        supabase.from('buses').select('name, bus_companies(name)'),
      ]);
      setSeats(s); setLug(l); setPend(p);
      const map: Record<string, { company: string; berths: number }> = {};
      ((b as any).data || []).forEach((r: any) => { map[r.name.trim()] = { company: r.bus_companies?.name || '', berths: r.bus_companies?.name === 'Vedaa' ? 34 : 36 }; });
      setBusCompany(map);
    })();
  }, [today, weekStart, weekEnd]);

  const rows = useMemo(() => {
    const m = new Map<string, { date: string; bus: string; berths: number; pieces: number }>();
    const key = (d: string, b: string) => `${d}|${b.trim()}`;
    seats.forEach((s) => { if (!s.bus_name) return; const k = key(s.journey_date, s.bus_name); const r = m.get(k) || { date: s.journey_date, bus: s.bus_name.trim(), berths: 0, pieces: 0 }; r.berths++; m.set(k, r); });
    lug.forEach((l) => { const k = key(l.journey_date, l.bus_name); const r = m.get(k) || { date: l.journey_date, bus: l.bus_name.trim(), berths: 0, pieces: 0 }; r.pieces += l.quantity || 0; m.set(k, r); });
    return [...m.values()].sort((a, b) => b.date.localeCompare(a.date) || b.berths - a.berths);
  }, [seats, lug]);

  const todayRows = rows.filter((r) => r.date === today);
  const todayBerths = todayRows.reduce((s, r) => s + r.berths, 0);
  const todayCap = todayRows.reduce((s, r) => s + (busCompany[r.bus]?.berths || 36), 0);
  const todayLug = lug.filter((l) => l.journey_date === today);
  const todayPieces = todayLug.reduce((s, l) => s + (l.quantity || 0), 0);
  const companyCount = todayRows.reduce<Record<string, number>>((a, r) => { const c = busCompany[r.bus]?.company || 'Other'; a[c] = (a[c] || 0) + 1; return a; }, {});

  const pending = useMemo(() => {
    const m = new Map<string, { name: string; amount: number; berths: number; oldest: string }>();
    pend.forEach((p) => {
      const k = p.booking_type === 'agent' ? p.agent_id || 'x' : p.booking_type;
      const name = p.booking_type === 'agent' ? p.agents?.name || 'Agent' : TYPE_NAME[p.booking_type];
      const r = m.get(k) || { name, amount: 0, berths: 0, oldest: p.journey_date };
      r.amount += Number(p.amount_from_agent) || 0; r.berths++; if (p.journey_date < r.oldest) r.oldest = p.journey_date;
      m.set(k, r);
    });
    return [...m.values()].sort((a, b) => b.amount - a.amount);
  }, [pend]);
  const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);

  const latest = useMemo(() => {
    const items: { time: string; bus: string; entry: string; type: string; party: string }[] = [];
    const groups = new Map<string, Seat[]>();
    seats.filter((s) => isToday(parseISO(s.created_at))).forEach((s) => {
      const k = `${s.created_at.slice(0, 16)}|${s.bus_name}|${s.booking_type}`;
      groups.set(k, [...(groups.get(k) || []), s]);
    });
    groups.forEach((g) => {
      const nums = g.map((s) => s.seat_number).sort((a, b) => a - b);
      items.push({ time: g[0].created_at, bus: (g[0].bus_name || '').trim(), entry: `${nums.length > 1 ? 'Berths' : 'Berth'} ${nums.join(', ')}`, type: g[0].booking_type, party: g[0].agents?.name || g[0].passenger_name || 'Not entered' });
    });
    lug.filter((l) => isToday(parseISO(l.created_at))).forEach((l) => items.push({ time: l.created_at, bus: l.bus_name.trim(), entry: `Luggage, ${l.quantity} pieces`, type: 'luggage', party: [l.party_name, l.item_name && `${l.item_name} to ${l.destination}`].filter(Boolean).join(', ') }));
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [seats, lug]);

  const ql = q.trim().toLowerCase();
  const shownRows = ql ? rows.filter((r) => r.bus.toLowerCase().includes(ql)) : rows;
  const shownPending = ql ? pending.filter((p) => p.name.toLowerCase().includes(ql)) : pending;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Today</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bus or agent" className="pl-9" />
            </div>
            <Button onClick={() => navigate('/seat-bookings')}><Plus className="h-4 w-4" /> Book seats</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border bg-card divide-x divide-y lg:divide-y-0 overflow-hidden">
          <div className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Buses today</p><p className="text-3xl font-bold mt-1">{todayRows.length}</p><p className="text-xs text-muted-foreground mt-1">{Object.entries(companyCount).map(([c, n]) => `${n} ${c}`).join(', ') || 'None yet'}</p></div>
          <div className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Berths booked</p><p className="text-3xl font-bold mt-1">{todayBerths} <span className="text-base font-normal text-muted-foreground">of {todayCap}</span></p><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${todayCap ? (todayBerths / todayCap) * 100 : 0}%` }} /></div></div>
          <div className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Luggage loaded</p><p className="text-3xl font-bold mt-1">{todayPieces} <span className="text-base font-normal text-muted-foreground">pieces</span></p><p className="text-xs text-muted-foreground mt-1">{todayLug.length} entries</p></div>
          <div className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Pending from agents</p><p className="text-3xl font-bold mt-1">{inr(pendingTotal)}</p><Link to="/agent-collections" className="text-xs underline mt-1 inline-block">Open agent collections</Link></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:px-5 border-b"><h2 className="font-semibold">Buses this week</h2><span className="text-xs text-muted-foreground hidden sm:inline">Seats and luggage, bus by bus</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left font-medium px-5 py-2">Date</th><th className="text-left font-medium px-2 py-2">Bus</th><th className="text-left font-medium px-2 py-2">Berths booked</th><th className="text-left font-medium px-2 py-2">Luggage</th><th /></tr></thead>
                <tbody>
                  {shownRows.slice(0, 12).map((r) => {
                    const cap = busCompany[r.bus]?.berths || 36;
                    return (
                      <tr key={r.date + r.bus} className="border-t">
                        <td className="px-5 py-3 whitespace-nowrap font-medium">{r.date === today ? 'Today' : format(parseISO(r.date), 'EEE d MMM')}</td>
                        <td className="px-2 py-3 whitespace-nowrap"><span className="bus-plate">{r.bus}</span> <span className="text-muted-foreground ml-1">{busCompany[r.bus]?.company}</span></td>
                        <td className="px-2 py-3 whitespace-nowrap"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (r.berths / cap) * 100)}%` }} /></div>{r.berths} of {cap}</div></td>
                        <td className="px-2 py-3 whitespace-nowrap">{r.pieces ? `${r.pieces} pieces` : <span className="text-muted-foreground">None</span>}</td>
                        <td className="px-5 py-3 text-right"><Link className="underline" to={`/seat-bookings?date=${r.date}&bus=${encodeURIComponent(r.bus)}`}>Open</Link></td>
                      </tr>
                    );
                  })}
                  {shownRows.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">No buses this week</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:px-5 border-b"><h2 className="font-semibold">Largest pending</h2><Link to="/agent-collections" className="text-sm underline">See all</Link></div>
            {shownPending.slice(0, 6).map((p) => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-3 border-t first:border-t-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(p.name)}</div>
                <div className="min-w-0 flex-1"><p className="font-medium truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.berths} berths, oldest trip {format(parseISO(p.oldest), 'd MMM')}</p></div>
                <p className="font-semibold">{inr(p.amount)}</p>
              </div>
            ))}
            {shownPending.length === 0 && <p className="p-5 text-sm text-muted-foreground">Nothing pending</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:px-5 border-b"><h2 className="font-semibold">Latest entries</h2><span className="text-xs text-muted-foreground">Today</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr><th className="text-left font-medium px-5 py-2">Time</th><th className="text-left font-medium px-2 py-2">Bus</th><th className="text-left font-medium px-2 py-2">Entry</th><th className="text-left font-medium px-2 py-2">Type</th><th className="text-left font-medium px-5 py-2">Agent or party</th></tr></thead>
              <tbody>
                {latest.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-5 py-3 whitespace-nowrap">{format(parseISO(e.time), 'h:mm a')}</td>
                    <td className="px-2 py-3"><span className="bus-plate">{e.bus}</span></td>
                    <td className="px-2 py-3 font-semibold whitespace-nowrap">{e.entry}</td>
                    <td className="px-2 py-3 whitespace-nowrap"><span className={`inline-block h-2.5 w-2.5 rounded-sm mr-2 ${TYPE_DOT[e.type]}`} />{TYPE_NAME[e.type]}</td>
                    <td className="px-5 py-3">{e.party}</td>
                  </tr>
                ))}
                {latest.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-muted-foreground">No entries yet today</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
