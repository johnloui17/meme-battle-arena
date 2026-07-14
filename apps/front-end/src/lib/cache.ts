export function isCacheValid(lastFetched: number | null, ttl: number): boolean {
  if (lastFetched === null) return false;
  return Date.now() - lastFetched < ttl;
}

export function listParamsMatch<T>(a: T | null, b: T | null): boolean {
  if (a === null || b === null) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}
