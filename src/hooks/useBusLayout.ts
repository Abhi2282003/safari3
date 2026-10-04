import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LayoutCell } from '@/components/seatBookings/LayoutGrid';

const db = supabase as any;

/** Seat layout for a bus on a journey date (picks the latest bus_layouts row valid on that date). */
export function useBusLayout(busName: string, journeyDate: string) {
  return useQuery({
    queryKey: ['bus-layout', busName.trim().toLowerCase(), journeyDate],
    enabled: !!busName.trim(),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: buses } = await db.from('buses').select('id,name,layout_id,company_id, bus_companies(name)');
      const bus = (buses || []).find((b: any) => b.name.trim().toLowerCase() === busName.trim().toLowerCase());
      if (!bus) return null;
      const { data: bl } = await db.from('bus_layouts').select('layout_id,valid_from')
        .eq('bus_id', bus.id).lte('valid_from', journeyDate).order('valid_from', { ascending: false }).limit(1);
      const layoutId = bl?.[0]?.layout_id || bus.layout_id;
      if (!layoutId) return { bus, companyName: bus.bus_companies?.name as string | undefined, layout: null, cells: [] as LayoutCell[] };
      const [{ data: layout }, { data: cells }] = await Promise.all([
        db.from('seat_layouts').select('*').eq('id', layoutId).single(),
        db.from('seat_layout_cells').select('*').eq('layout_id', layoutId),
      ]);
      return { bus, companyName: bus.bus_companies?.name as string | undefined, layout, cells: (cells || []) as LayoutCell[] };
    },
  });
}

export function seatLabel(cells: LayoutCell[] | undefined, seat: number) {
  return cells?.find((c) => c.seat_number === seat && c.cell_type === 'berth')?.label || String(seat);
}
