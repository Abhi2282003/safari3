/**
 * Fetch every row of a query past the 1,000-row server limit.
 * Pages are requested several at a time (in parallel) so large lists load in
 * one or two round trips instead of one trip per 1,000 rows.
 * The query should have a stable order (end with .order('id')) so pages never overlap.
 */
export async function fetchAll<T = any>(
  build: () => any,
  pageSize = 1000,
  parallel = 4,
): Promise<{ data: T[]; error: any }> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const batch = await Promise.all(
      Array.from({ length: parallel }, (_, i) => {
        const start = from + i * pageSize;
        return build().range(start, start + pageSize - 1);
      }),
    );
    let done = false;
    for (const res of batch) {
      if (res.error) return { data: all, error: res.error };
      const rows = res.data || [];
      all.push(...rows);
      if (rows.length < pageSize) {
        done = true;
        break;
      }
    }
    if (done) break;
    from += parallel * pageSize;
  }
  // Guard against overlap if the order was not fully stable
  const seen = new Set<string>();
  const unique = all.filter((r: any) => {
    if (!r || r.id === undefined) return true;
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  return { data: unique, error: null };
}
