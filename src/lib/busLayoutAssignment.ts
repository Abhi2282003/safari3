export type BusLayoutAssignment = { id: string; bus_id: string; layout_id: string; valid_from: string };

export function effectiveBusLayout(bus: { id: string; layout_id?: string | null }, assignments: BusLayoutAssignment[], date: string) {
  return assignments.filter((item) => item.bus_id === bus.id && item.valid_from <= date)
    .sort((a, b) => b.valid_from.localeCompare(a.valid_from) || b.id.localeCompare(a.id))[0]?.layout_id || bus.layout_id || null;
}

export function canAppendBusLayout(busId: string, assignments: BusLayoutAssignment[], date: string) {
  return Boolean(date) && !assignments.some((item) => item.bus_id === busId && item.valid_from >= date);
}