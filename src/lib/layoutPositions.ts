export interface PositionedCell {
  grid_row: number;
  grid_col: number;
  row_span?: number;
}

/** Omit slots covered by a taller cell, retaining gaps in legacy layouts. */
export function layoutPositions<T extends PositionedCell>(cells: T[], rows: number, cols: number) {
  const minRow = Math.min(1, ...cells.map((cell) => cell.grid_row));
  const slots: { cell: T | undefined; row: number; col: number }[] = [];
  for (let row = minRow; row < minRow + rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = cells.find((item) => item.grid_row === row && item.grid_col === col);
      const covered = cells.some((item) => item.grid_col === col && item.grid_row < row &&
        item.grid_row + (item.row_span || 1) > row);
      if (!covered) slots.push({ cell, row: row - minRow + 1, col: col + 1 });
    }
  }
  return slots;
}