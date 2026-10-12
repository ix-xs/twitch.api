/** A value or a promise of it. */
export type Awaitable<T> = T | PromiseLike<T>;

/** Flattens an intersection so editors show the final shape. */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

type Listener<A extends unknown[]> = (...args: A) => void;
type AnyListener = (...args: any[]) => void;

/** Minimal typed event emitter. A listener that throws never breaks the emitter. */
export class Emitter<Events extends { [K in keyof Events]: unknown[] }> {
  readonly #listeners = new Map<keyof Events, Set<AnyListener>>();

  /** Registers a listener. Returns a function that removes it. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.#listeners.get(event);
    if (!set) this.#listeners.set(event, (set = new Set()));
    set.add(listener);
    return () => this.off(event, listener);
  }

  /** Registers a listener that runs once. */
  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const off = this.on(event, ((...args: Events[K]) => {
      off();
      listener(...args);
    }) as Listener<Events[K]>);
    return off;
  }

  /** Removes a listener. */
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.#listeners.get(event)?.delete(listener);
  }

  /** Calls every listener of `event`. Returns whether there was at least one. */
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const set = this.#listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const listener of [...set]) {
      try {
        listener(...args);
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    }
    return true;
  }

  /** Whether `event` has at least one listener. */
  has(event: keyof Events): boolean {
    return (this.#listeners.get(event)?.size ?? 0) > 0;
  }

  /** Removes every listener. */
  clear(): void {
    this.#listeners.clear();
  }
}

/** Resolves after `ms`, or rejects with the signal's reason if it aborts first. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Keeps a timer from holding the process open, on runtimes that support it. */
export function unref<T>(timer: T): T {
  // Node.js and Bun hand back an object with unref(). Deno hands back a number and has its own call.
  if (typeof timer === "number") (globalThis as { Deno?: { unrefTimer?(id: number): void } }).Deno?.unrefTimer?.(timer);
  else (timer as { unref?: () => void }).unref?.();
  return timer;
}

/** Exponential backoff with full jitter. `attempt` starts at 0. */
export function backoff(attempt: number, base = 250, max = 8000): number {
  const ceiling = Math.min(max, base * 2 ** attempt);
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
}

/** Short, one way fingerprint of a string (FNV-1a). Lets a secret name something without appearing in it. */
export function fingerprint(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Splits a list into chunks of at most `size` items. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Wraps a single value in an array, leaves arrays alone, drops `undefined`. */
export function toArray<T>(value: T | readonly T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

/**
 * A bounded map that evicts its oldest entry when full. Used for caches and
 * for remembering message IDs.
 */
export class BoundedMap<K, V> {
  readonly #map = new Map<K, V>();
  readonly #max: number;

  constructor(max: number) {
    this.#max = max;
  }

  /** Number of entries. */
  get size(): number {
    return this.#map.size;
  }

  /** Whether `key` is present. */
  has(key: K): boolean {
    return this.#map.has(key);
  }

  /** Returns the value of `key`, if present. */
  get(key: K): V | undefined {
    return this.#map.get(key);
  }

  /** Adds or refreshes an entry, evicting the oldest one when the map is full. */
  set(key: K, value: V): void {
    if (this.#map.has(key)) this.#map.delete(key);
    else if (this.#map.size >= this.#max) {
      const oldest = this.#map.keys().next();
      if (!oldest.done) this.#map.delete(oldest.value);
    }
    this.#map.set(key, value);
  }

  /** Removes an entry. Returns whether it was there. */
  delete(key: K): boolean {
    return this.#map.delete(key);
  }

  /** Removes every entry. */
  clear(): void {
    this.#map.clear();
  }
}
