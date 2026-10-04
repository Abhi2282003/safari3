# Engineering rules

- Load large lists through `src/lib/fetchAll.ts` with a stable order ending in `.order('id')` — it fetches 1,000-row pages in parallel, past the server row cap.
- Pages load only the rows and columns they need (filter by date or booking type, explicit column lists) — full-table downloads made screens slow.
