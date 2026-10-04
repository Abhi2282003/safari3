/** Fetch every row of a query, page by page, past the 1,000-row server limit. */
export async function fetchAll<T = any>(build: () => any, pageSize = 1000): Promise<{ data: T[]; error: any }> {
  let from = 0;
  const all: T[] = [];
  while (true) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: all, error };
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return { data: all, error: null };
}
