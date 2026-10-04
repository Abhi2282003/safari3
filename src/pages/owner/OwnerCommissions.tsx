import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { OwnerGate, OwnerNav } from '@/components/owner/OwnerGate';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { changeOwnerPassword } from '@/lib/ownerLock';

const db = supabase as any;

function Content() {
  const [types, setTypes] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [sample, setSample] = useState(1000);
  const [pw, setPw] = useState({ cur: '', next: '' });

  const load = async () => {
    const [t, r] = await Promise.all([
      db.from('booking_types').select('*').order('created_at'),
      db.from('commission_rules').select('*').is('agent_id', null).is('bus_id', null).is('company_id', null).order('valid_from'),
    ]);
    setTypes(t.data || []); setRules(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const updRule = async (id: string, patch: any) => {
    const { error } = await db.from('commission_rules').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };
  const updType = async (id: string, patch: any) => {
    const { error } = await db.from('booking_types').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const savePw = async () => {
    const r = await changeOwnerPassword(pw.cur, pw.next);
    if (!r.ok) return toast.error(r.message);
    setPw({ cur: '', next: '' }); toast.success('Owner password changed');
  };

  const rows = [...types.map((t) => ({ t, r: rules.find((x) => x.booking_type_id === t.id) })), { t: null, r: rules.find((x) => x.is_luggage) }];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <CardTitle className="text-base mr-auto">Default commission rules</CardTitle>
          <span className="text-sm text-muted-foreground">Sample fare</span>
          <Input type="number" className="w-28 h-9" value={sample} onChange={(e) => setSample(Number(e.target.value) || 0)} />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Type</th><th>Total %</th><th>Our %</th><th>Agent %</th><th>Owner gets</th><th>Collect from party</th><th>Split of sample</th><th>Active</th></tr>
            </thead>
            <tbody>
              {rows.map(({ t, r }, i) => r && (
                <tr key={i} className="border-t">
                  <td className="py-2 font-medium">
                    {t ? <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: t.colour }} />{t.name}</span> : 'Luggage'}
                  </td>
                  {(['total_percent', 'our_percent', 'agent_percent'] as const).map((k) => (
                    <td key={k}><Input type="number" defaultValue={r[k]} className="w-20 h-8" onBlur={(e) => Number(e.target.value) !== Number(r[k]) && updRule(r.id, { [k]: Number(e.target.value) })} /></td>
                  ))}
                  <td><Switch checked={r.owner_gets} onCheckedChange={(v) => updRule(r.id, { owner_gets: v })} /></td>
                  <td><Switch checked={r.collect_from_party} onCheckedChange={(v) => updRule(r.id, { collect_from_party: v })} /></td>
                  <td className="text-xs">
                    Ours {Math.round(sample * r.our_percent / 100)} · Agent {Math.round(sample * r.agent_percent / 100)} · Owner {r.owner_gets ? Math.round(sample - sample * r.total_percent / 100) : 0}
                  </td>
                  <td>{t && <Switch checked={t.active} onCheckedChange={(v) => updType(t.id, { active: v })} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">Changes apply to new bookings only. Saved bookings keep their amounts.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Owner password</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input type="password" placeholder="Current password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} className="w-48" />
          <Input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="w-48" />
          <Button onClick={savePw}>Change</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OwnerCommissions() {
  return (
    <Layout>
      <OwnerGate>
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          <OwnerNav />
          <h1 className="text-xl font-bold mb-4">Commissions</h1>
          <Content />
        </div>
      </OwnerGate>
    </Layout>
  );
}
