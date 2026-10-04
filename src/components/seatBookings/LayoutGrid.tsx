import { cn } from '@/lib/utils';

export interface LayoutCell {
  id?: string;
  grid_row: number;
  grid_col: number;
  cell_type: string;
  deck: string | null;
  label: string | null;
  seat_number: number | null;
}

/** Draws a seat layout from data. renderBerth lets callers customise booked berths. */
export function LayoutGrid({
  cells, cols, onCellClick, renderBerth,
}: {
  cells: LayoutCell[];
  cols: number;
  onCellClick?: (c: LayoutCell) => void;
  renderBerth?: (c: LayoutCell) => React.ReactNode;
}) {
  const rows = Math.max(0, ...cells.map((c) => c.grid_row));
  const minRow = Math.min(...cells.map((c) => c.grid_row), 1);
  const grid: (LayoutCell | undefined)[][] = [];
  for (let r = minRow; r <= rows; r++) {
    grid.push(Array.from({ length: cols }, (_, c) => cells.find((x) => x.grid_row === r && x.grid_col === c)));
  }
  return (
    <div className="inline-block rounded-xl border bg-card p-3">
      <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Front</span><span>Driver</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.5rem, 1fr))` }}>
        {grid.flat().map((c, i) => {
          if (!c || c.cell_type === 'empty') return <div key={i} className="h-11" />;
          if (c.cell_type === 'toilet' || c.cell_type === 'driver') {
            return <div key={i} className="h-11 rounded-md bg-muted text-[10px] flex items-center justify-center text-muted-foreground">{c.label || c.cell_type}</div>;
          }
          return (
            <button
              type="button"
              key={i}
              onClick={() => onCellClick?.(c)}
              className={cn(
                'h-11 rounded-md border text-xs font-medium flex flex-col items-center justify-center',
                c.deck === 'upper' ? 'bg-secondary' : 'bg-background'
              )}
            >
              {renderBerth ? renderBerth(c) : (
                <>
                  <span>{c.label}</span>
                  {c.deck && <span className="text-[9px] text-muted-foreground">{c.deck === 'upper' ? 'U' : 'L'}</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
