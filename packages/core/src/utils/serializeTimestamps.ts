/**
 * Recursively walks an object and converts Firestore-shaped timestamps
 * to plain millisecond numbers. v1.0.0 of the SDK no longer talks to
 * Firestore, but the utility is preserved (and broadened) so legacy
 * Redux state slices that still carry Timestamp-like objects survive
 * a round-trip through this helper without complaint.
 *
 * Detected shape: `{ seconds: number, nanoseconds: number }` or
 * anything with a `.toMillis()` method.
 */
type TimestampLike = { seconds?: number; nanoseconds?: number; toMillis?: () => number };

function isTimestampLike(x: unknown): x is TimestampLike {
  if (!x || typeof x !== 'object') return false;
  const t = x as TimestampLike;
  if (typeof t.toMillis === 'function') return true;
  if (typeof t.seconds === 'number' && typeof t.nanoseconds === 'number') return true;
  return false;
}

function timestampToMillis(t: TimestampLike): number {
  if (typeof t.toMillis === 'function') return t.toMillis();
  return (t.seconds ?? 0) * 1000 + Math.floor((t.nanoseconds ?? 0) / 1e6);
}

export function serializeTimestamps<T>(input: T): T {
  if (input == null) return input;
  if (isTimestampLike(input)) {
    return timestampToMillis(input as TimestampLike) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => serializeTimestamps(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = serializeTimestamps(v);
    }
    return out as T;
  }
  return input;
}
