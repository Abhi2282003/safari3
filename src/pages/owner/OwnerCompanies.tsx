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

const db = supabase as any;

function Content() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [newCo, setNewCo] = useState({ name: '', prefix: '' });
  const [newBus, setNewBus] = useState({ name: '', company_id: '' });

  const load = async () => {
    const [c, b, l] = await Promise.all([
      db.from('bus_companies').select('*').order('name'),
      db.from('buses').select('*').order('name'),
      db.from('seat_layouts').select('id,name,company_id').order('name'),
    ]);
    setCompanies(c.data || []); setBuses(b.data || []); setLayouts(l.data || []);
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
    setNewBus((p) => ({ name, company_id: p.company_id || match?.id || '' }));
  };

  const addBus = async () => {
    if (!newBus.name.trim() || !user) return;
    const co = companies.find((c) => c.id === newBus.company_id);
    const { data, error } = await db.from('buses').insert({
      user_id: user.id, name: newBus.name.trim(), active: true,
      company_id: newBus.company_id || null, layout_id: co?.default_layout_id || null,
    }).select().single();
    if (error) return toast.error(error.message);
    if (co?.default_layout_id) await db.from('bus_layouts').insert({ user_id: user.id, bus_id: data.id, layout_id: co.default_layout_id });
    setNewBus({ name: '', company_id: '' }); load(); toast.success('Bus added');
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
            <Select value={newBus.company_id} onValueChange={(v) => setNewBus({ ...newBus, company_id: v })}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Company" /></SelectTrigger>
              <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
              <div className="ml-auto flex items-center gap-2 text-sm">Active <Switch checked={b.active ?? true} onCheckedChange={(v) => updateBus(b.id, { active: v })} /></div>
            </div>
          ))}
        </CardContent>
      </Card>
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
