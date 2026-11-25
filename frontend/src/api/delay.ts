/** Simulated network latency so loading states are visible; 0 in tests. */
export function delay<T>(value: T, ms = 250): Promise<T> {
  const wait = import.meta.env.MODE === 'test' ? 0 : ms
  return new Promise((resolve) => setTimeout(() => resolve(value), wait))
}
