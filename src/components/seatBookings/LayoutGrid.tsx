import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { layoutPositions } from '@/lib/layoutPositions';

export interface LayoutCell {
  id?: string;
  grid_row: number;
  grid_col: number;
  cell_type: string;
  deck: string | null;
  label: string | null;
  seat_number: number | null;
  row_span?: number;
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
  const rows = Math.max(0, ...cells.map((c) => c.grid_row + (c.row_span || 1) - 1));
  const minRow = Math.min(...cells.map((c) => c.grid_row), 1);
  const grid = layoutPositions(cells, rows - minRow + 1, cols);
  return (
    <div className="inline-block rounded-xl border bg-card p-3">
      <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Front</span><span>Driver</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.5rem, 1fr))`, gridAutoRows: '2.75rem' }}>
        {grid.map(({ cell: c, row, col }, i) => {
          const position = { gridRow: `${row} / span ${c?.row_span || 1}`, gridColumn: col };
          if (!c || c.cell_type === 'empty') return <div key={i} style={position} />;
          if (c.cell_type === 'toilet' || c.cell_type === 'driver') {
            return <div key={i} style={position} className="h-full rounded-md bg-muted text-[10px] flex items-center justify-center text-muted-foreground">{c.label || c.cell_type}</div>;
          }
          return (
            <Button
              type="button"
              variant="outline"
              key={i}
              style={position}
              onClick={() => onCellClick?.(c)}
              className={cn(
                'h-full px-1 gap-0 rounded-md border text-xs font-medium flex flex-col items-center justify-center',
                c.deck === 'upper' ? 'bg-secondary' : 'bg-background'
              )}
            >
              {renderBerth ? renderBerth(c) : (
                <>
                  <span>{c.label}</span>
                  {c.deck && <span className="text-[9px] text-muted-foreground">{c.deck === 'upper' ? 'U' : 'L'}</span>}
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
