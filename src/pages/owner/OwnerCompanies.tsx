import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { OwnerGate, OwnerNav } from '@/components/owner/OwnerGate';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchAll } from '@/lib/fetchAll';
import { canAppendBusLayout, effectiveBusLayout, type BusLayoutAssignment } from '@/lib/busLayoutAssignment';

const db = supabase as any;

function Content() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [companies, setCompanies] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [newCo, setNewCo] = useState({ name: '', prefix: '' });
  const [newBus, setNewBus] = useState({ name: '', company_id: '', layout_id: '' });
  const [assignments, setAssignments] = useState<BusLayoutAssignment[]>([]);
  const [layoutEdit, setLayoutEdit] = useState<{ bus_id: string; layout_id: string; valid_from: string } | null>(null);
  const [savingLayout, setSavingLayout] = useState(false);

  const load = async () => {
    const [c, b, l, a] = await Promise.all([
      fetchAll(() => db.from('bus_companies').select('id,name,number_prefix,default_layout_id,active').order('name').order('id')),
      fetchAll(() => db.from('buses').select('id,name,company_id,layout_id,display_name,active').order('name').order('id')),
      fetchAll(() => db.from('seat_layouts').select('id,name,company_id,total_berths').order('name').order('id')),
      fetchAll<BusLayoutAssignment>(() => db.from('bus_layouts').select('id,bus_id,layout_id,valid_from').order('valid_from').order('id')),
    ]);
    const error = c.error || b.error || l.error || a.error;
    if (error) return toast.error(error.message);
    setCompanies(c.data || []); setBuses(b.data || []); setLayouts(l.data || []);
    setAssignments(a.data);
  };
  useEffect(() => { load(); }, []);

  const addCompany = async () => {
    if (!newCo.name.trim() || !user) return;
    const { error } = await db.from('bus_companies').insert({ user_id: user.id, name: newCo.name.trim(), number_prefix: newCo.prefix.trim().toUpperCase() || null });
    if (error) return toast.error(error.message);
    setNewCo({ name: '', prefix: '' }); load();
  };

  const onBusName = (name: string) => {
    const match = companies.find((c) => c.number_prefix && name.toUpperCase().startsWith(c.number_prefix));
    setNewBus((p) => ({ ...p, name, company_id: p.company_id || match?.id || '' }));
  };

  const addBus = async () => {
    if (!newBus.name.trim() || !user) return;
    const co = companies.find((c) => c.id === newBus.company_id);
    const { data, error } = await db.from('buses').insert({
      user_id: user.id, name: newBus.name.trim(), active: true,
      company_id: newBus.company_id || null, layout_id: newBus.layout_id || co?.default_layout_id || null,
    }).select().single();
    if (error) return toast.error(error.message);
    setNewBus({ name: '', company_id: '', layout_id: '' }); load(); toast.success('Bus added');
  };

  const saveLayout = async () => {
    if (!layoutEdit || !user || !layoutEdit.layout_id || !layoutEdit.valid_from) return;
    setSavingLayout(true);
    try {
      const current = await fetchAll<BusLayoutAssignment>(() => db.from('bus_layouts')
        .select('id,bus_id,layout_id,valid_from').eq('bus_id', layoutEdit.bus_id).order('valid_from').order('id'));
      if (current.error) throw current.error;
      if (!canAppendBusLayout(layoutEdit.bus_id, current.data, layoutEdit.valid_from)) {
        toast.error('Choose a start date after the last saved layout date');
        return;
      }
      const { error } = await db.from('bus_layouts').insert({ user_id: user.id, ...layoutEdit });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['bus-layout'] });
      await load();
      setLayoutEdit(null);
      toast.success('Bus layout saved');
    } catch (error: any) {
      toast.error(error.message || 'Could not save bus layout');
    } finally {
      setSavingLayout(false);
    }
  };

  const updateBus = async (id: string, patch: any) => {
    const { error } = await db.from('buses').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };
  const updateCo = async (id: string, patch: any) => {
    const { error } = await db.from('bus_companies').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle className="text-base">Companies</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {companies.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-2">
              <span className="font-medium min-w-[110px]">{c.name}</span>
              <span className="text-xs text-muted-foreground">Prefix {c.number_prefix || '-'}</span>
              <Select value={c.default_layout_id || ''} onValueChange={(v) => updateCo(c.id, { default_layout_id: v })}>
                <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Default layout" /></SelectTrigger>
                <SelectContent>{layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2 text-sm">Active <Switch checked={c.active} onCheckedChange={(v) => updateCo(c.id, { active: v })} /></div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Company name" value={newCo.name} onChange={(e) => setNewCo({ ...newCo, name: e.target.value })} className="max-w-xs" />
            <Input placeholder="Number prefix (e.g. MH)" value={newCo.prefix} onChange={(e) => setNewCo({ ...newCo, prefix: e.target.value })} className="w-44" />
            <Button onClick={addCompany}>Add company</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Buses</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-3">
            <Input placeholder="Bus number" value={newBus.name} onChange={(e) => onBusName(e.target.value)} className="max-w-xs" />
            <Select value={newBus.company_id} onValueChange={(v) => setNewBus({ ...newBus, company_id: v, layout_id: '' })}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={newBus.layout_id || 'default'} onValueChange={(v) => setNewBus({ ...newBus, layout_id: v === 'default' ? '' : v })}>
              <SelectTrigger aria-label="New bus layout" className="w-full sm:w-60"><SelectValue placeholder="Layout" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Company default</SelectItem>
                {layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.total_berths})</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={addBus}>Add bus</Button>
          </div>
          {buses.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-2 border rounded-lg p-2">
              <span className="font-mono text-sm font-semibold rounded border-2 border-foreground bg-warning/80 px-2 py-0.5">{b.name}</span>
              <Select value={b.company_id || ''} onValueChange={(v) => updateBus(b.id, { company_id: v })}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Company" /></SelectTrigger>
                <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input defaultValue={b.display_name || ''} placeholder="Friendly name" className="h-9 w-48"
                onBlur={(e) => e.target.value !== (b.display_name || '') && updateBus(b.id, { display_name: e.target.value || null })} />
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <span className="text-xs text-muted-foreground">{layouts.find((l) => l.id === effectiveBusLayout(b, assignments, today))?.name || 'No layout'}</span>
                <Button variant="outline" size="sm" aria-label={`Change layout for ${b.name}`} onClick={() => setLayoutEdit({ bus_id: b.id, layout_id: effectiveBusLayout(b, assignments, today) || '', valid_from: today })}>Change layout</Button>
              </div>
              <div className="ml-auto flex items-center gap-2 text-sm">Active <Switch checked={b.active ?? true} onCheckedChange={(v) => updateBus(b.id, { active: v })} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog open={!!layoutEdit} onOpenChange={(open) => !open && !savingLayout && setLayoutEdit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Layout — {buses.find((b) => b.id === layoutEdit?.bus_id)?.name}</DialogTitle></DialogHeader>
          {layoutEdit && <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seat layout</Label>
              <Select value={layoutEdit.layout_id} onValueChange={(v) => setLayoutEdit({ ...layoutEdit, layout_id: v })}>
                <SelectTrigger aria-label="Seat layout"><SelectValue placeholder="Choose layout" /></SelectTrigger>
                <SelectContent>{layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.total_berths})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="layout-start-date">From date</Label>
              <Input id="layout-start-date" type="date" value={layoutEdit.valid_from} onChange={(e) => setLayoutEdit({ ...layoutEdit, valid_from: e.target.value })} />
            </div>
            <Button className="w-full" onClick={saveLayout} disabled={savingLayout || !layoutEdit.layout_id || !layoutEdit.valid_from}>{savingLayout ? 'Saving…' : 'Save layout'}</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OwnerCompanies() {
  return (
    <Layout>
      <OwnerGate>
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <OwnerNav />
          <h1 className="text-xl font-bold mb-4">Companies and buses</h1>
          <Content />
        </div>
      </OwnerGate>
    </Layout>
  );
}
