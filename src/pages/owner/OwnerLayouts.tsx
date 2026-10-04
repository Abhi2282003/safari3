import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { OwnerGate, OwnerNav } from '@/components/owner/OwnerGate';
import { LayoutGrid, LayoutCell } from '@/components/seatBookings/LayoutGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const db = supabase as any;

function Content() {
  const { user } = useAuth();
  const [layouts, setLayouts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [cells, setCells] = useState<LayoutCell[]>([]);
  const [editing, setEditing] = useState<LayoutCell | null>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [busLayouts, setBusLayouts] = useState<any[]>([]);
  const [move, setMove] = useState({ bus_id: '', layout_id: '', valid_from: '' });

  const load = async () => {
    const [l, b, bl] = await Promise.all([
      db.from('seat_layouts').select('*').order('name'),
      db.from('buses').select('id,name').order('name'),
      db.from('bus_layouts').select('*').order('valid_from'),
    ]);
    setLayouts(l.data || []); setBuses(b.data || []); setBusLayouts(bl.data || []);
    if (!selected && l.data?.[0]) setSelected(l.data[0].id);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!selected) return;
    db.from('seat_layout_cells').select('*').eq('layout_id', selected).then(({ data }: any) => setCells(data || []));
  }, [selected]);

  const layout = layouts.find((l) => l.id === selected);

  const saveCell = async () => {
    if (!editing?.id) return;
    const { error } = await db.from('seat_layout_cells').update({
      cell_type: editing.cell_type, deck: editing.deck, label: editing.label,
      seat_number: editing.cell_type === 'berth' ? editing.seat_number : null,
    }).eq('id', editing.id);
    if (error) return toast.error(error.message);
    const { data } = await db.from('seat_layout_cells').select('*').eq('layout_id', selected);
    setCells(data || []);
    const berths = (data || []).filter((c: any) => c.cell_type === 'berth').length;
    await db.from('seat_layouts').update({ total_berths: berths }).eq('id', selected);
    setEditing(null); load();
  };

  const tryEdit = async (c: LayoutCell) => {
    setEditing({ ...c });
  };

  const guardedSave = async () => {
    if (!editing) return;
    const orig = cells.find((c) => c.id === editing.id);
    if (orig?.cell_type === 'berth' && editing.cell_type !== 'berth' && orig.seat_number) {
      const busIds = busLayouts.filter((b) => b.layout_id === selected).map((b) => b.bus_id);
      const names = buses.filter((b) => busIds.includes(b.id)).map((b) => b.name);
      if (names.length) {
        const { count } = await db.from('seat_bookings').select('id', { count: 'exact', head: true })
          .eq('seat_number', orig.seat_number).in('bus_name', names);
        if (count) return toast.error('This berth has bookings and cannot be removed');
      }
    }
    saveCell();
  };

  const copyLayout = async () => {
    if (!layout || !user) return;
    const name = prompt('Name for the copy', `${layout.name} copy`);
    if (!name) return;
    const { data, error } = await db.from('seat_layouts').insert({ user_id: user.id, company_id: layout.company_id, name, rows: layout.rows, cols: layout.cols, total_berths: layout.total_berths }).select().single();
    if (error) return toast.error(error.message);
    await db.from('seat_layout_cells').insert(cells.map(({ id, ...c }: any) => ({ ...c, layout_id: data.id })));
    setSelected(data.id); load();
  };

  const newLayout = async () => {
    if (!user) return;
    const name = prompt('Layout name'); if (!name) return;
    const rows = Number(prompt('Rows', '6')); const cols = Number(prompt('Columns', '7'));
    if (!rows || !cols) return;
    const { data, error } = await db.from('seat_layouts').insert({ user_id: user.id, name, rows, cols, total_berths: rows * cols }).select().single();
    if (error) return toast.error(error.message);
    const list = [];
    let n = 1;
    for (let r = 1; r <= rows; r++) for (let c = 0; c < cols; c++) list.push({ layout_id: data.id, grid_row: r, grid_col: c, cell_type: 'berth', deck: 'lower', label: String(n), seat_number: n++ });
    await db.from('seat_layout_cells').insert(list);
    setSelected(data.id); load();
  };

  const addMove = async () => {
    if (!move.bus_id || !move.layout_id || !move.valid_from || !user) return toast.error('Pick bus, layout and date');
    const { error } = await db.from('bus_layouts').insert({ user_id: user.id, ...move });
    if (error) return toast.error(error.message);
    setMove({ bus_id: '', layout_id: '', valid_from: '' }); load(); toast.success('Saved');
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 space-y-0">
          <CardTitle className="text-base mr-auto">Layout editor</CardTitle>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Layout" /></SelectTrigger>
            <SelectContent>{layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.total_berths})</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={copyLayout}>Copy as new</Button>
          <Button variant="outline" onClick={newLayout}>New layout</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {layout && <LayoutGrid cells={cells} cols={layout.cols} onCellClick={tryEdit} />}
          <p className="text-xs text-muted-foreground mt-2">Tap a cell to change its type, deck and label. Shaded cells are upper berths.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Bus layout by date</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {busLayouts.map((bl) => (
            <div key={bl.id} className="text-sm flex gap-3 border-b py-1">
              <span className="font-mono w-36">{buses.find((b) => b.id === bl.bus_id)?.name}</span>
              <span className="flex-1">{layouts.find((l) => l.id === bl.layout_id)?.name}</span>
              <span className="text-muted-foreground">from {bl.valid_from}</span>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Select value={move.bus_id} onValueChange={(v) => setMove({ ...move, bus_id: v })}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Bus" /></SelectTrigger>
              <SelectContent>{buses.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={move.layout_id} onValueChange={(v) => setMove({ ...move, layout_id: v })}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Layout" /></SelectTrigger>
              <SelectContent>{layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" className="w-40" value={move.valid_from} onChange={(e) => setMove({ ...move, valid_from: e.target.value })} />
            <Button onClick={addMove}>Move bus to layout</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit cell</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Select value={editing.cell_type} onValueChange={(v) => setEditing({ ...editing, cell_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['berth', 'toilet', 'driver', 'empty'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editing.deck || 'none'} onValueChange={(v) => setEditing({ ...editing, deck: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="lower">Lower</SelectItem><SelectItem value="upper">Upper</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
              </Select>
              <Input placeholder="Label" value={editing.label || ''} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              {editing.cell_type === 'berth' && (
                <Input type="number" placeholder="Seat number" value={editing.seat_number ?? ''} onChange={(e) => setEditing({ ...editing, seat_number: e.target.value ? Number(e.target.value) : null })} />
              )}
              <Button className="w-full" onClick={guardedSave}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OwnerLayouts() {
  return (
    <Layout>
      <OwnerGate>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <OwnerNav />
          <h1 className="text-xl font-bold mb-4">Seat layouts</h1>
          <Content />
        </div>
      </OwnerGate>
    </Layout>
  );
}
