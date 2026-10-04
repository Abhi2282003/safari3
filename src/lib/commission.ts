import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;
let cache: { at: number; rules: any[]; types: any[]; buses: any[] } | null = null;

async function load() {
  if (cache && Date.now() - cache.at < 60_000) return cache;
  const [r, t, b] = await Promise.all([
    db.from('commission_rules').select('*').lte('valid_from', new Date().toISOString().slice(0, 10)),
    db.from('booking_types').select('*'),
    db.from('buses').select('id,name,company_id'),
  ]);
  cache = { at: Date.now(), rules: r.data || [], types: t.data || [], buses: b.data || [] };
  return cache;
}

export function clearCommissionCache() { cache = null; }

export async function findBus(busName?: string) {
  if (!busName) return null;
  const c = await load();
  return c.buses.find((b) => b.name.trim().toLowerCase() === busName.trim().toLowerCase()) || null;
}

/**
 * Amounts for a NEW booking from admin commission rules.
 * Picks agent, then bus, then company, then default rule. Returns null if no rule applies
 * so the caller can fall back to the built-in rates.
 */
export async function amountsFromRules(typeKey: string, amount: number, opts: { agentId?: string; busName?: string }) {
  try {
    const c = await load();
    const type = c.types.find((t) => t.key === typeKey);
    if (!type) return null;
    const bus = await findBus(opts.busName);
    const candidates = c.rules
      .filter((r) => r.booking_type_id === type.id && !r.is_luggage)
      .filter((r) => (!r.agent_id || r.agent_id === opts.agentId) && (!r.bus_id || r.bus_id === bus?.id) && (!r.company_id || r.company_id === bus?.company_id));
    const score = (r: any) => (r.agent_id ? 8 : 0) + (r.bus_id ? 4 : 0) + (r.company_id ? 2 : 0);
    candidates.sort((a, b) => score(b) - score(a) || (b.valid_from > a.valid_from ? 1 : -1));
    const rule = candidates[0];
    if (!rule) return null;
    const total = (amount * Number(rule.total_percent)) / 100;
    const ourEarning = (amount * Number(rule.our_percent)) / 100;
    const amountToOwner = rule.owner_gets ? amount - total : 0;
    const agentPart = (amount * Number(rule.agent_percent)) / 100;
    const amountFromAgent = rule.collect_from_party ? amount - (Number(rule.agent_percent) > 0 ? agentPart : total) : 0;
    return {
      commissionPercent: Number(rule.total_percent),
      ourEarning, amountToOwner, amountFromAgent,
      bookingTypeId: type.id as string, busId: (bus?.id as string) || null,
    };
  } catch {
    return null;
  }
}

export async function luggagePercent(): Promise<number> {
  try {
    const c = await load();
    const r = c.rules.filter((x) => x.is_luggage).sort((a, b) => (b.valid_from > a.valid_from ? 1 : -1))[0];
    return r ? Number(r.our_percent) : 30;
  } catch { return 30; }
}
