import { Timestamp } from 'firebase/firestore';

/**
 * Recursively walks an object and converts Firestore Timestamp instances to
 * plain millisecond numbers — necessary because Firestore Timestamps don't
 * survive JSON serialization (Redux dev tools, AsyncStorage, etc.).
 */
export function serializeTimestamps<T>(input: T): T {
  if (input == null) return input;
  if (input instanceof Timestamp) {
    return input.toMillis() as unknown as T;
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
