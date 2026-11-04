import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutPositions } from './layoutPositions';

test('two-row sleeper leaves space for two adjacent seats without a duplicate slot', () => {
  const cells = [
    { grid_row: 1, grid_col: 0, row_span: 2 },
    { grid_row: 1, grid_col: 1, row_span: 1 },
    { grid_row: 2, grid_col: 1, row_span: 1 },
  ];
  const slots = layoutPositions(cells, 2, 2);
  assert.deepEqual(slots.map(({ row, col }) => [row, col]), [[1, 1], [1, 2], [2, 2]]);
});

test('legacy cells with no span still occupy one slot each', () => {
  assert.equal(layoutPositions([{ grid_row: 1, grid_col: 0 }], 2, 2).length, 4);
});