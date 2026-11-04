# Engineering rules

- Mixed seat charts use `seat_layout_cells.row_span` and the shared `layoutPositions` helper in both editor and booking views, so sleepers can span two seat rows without duplicate cells.

- Load large lists through `src/lib/fetchAll.ts` with a stable order ending in `.order('id')` — it fetches 1,000-row pages in parallel, past the server row cap.
- Pages load only the rows and columns they need (filter by date or booking type, explicit column lists) — full-table downloads made screens slow.
