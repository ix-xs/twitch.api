import { chunk } from "../util.js";

interface Waiter<V> {
  resolve: (value: V | null) => void;
  reject: (error: unknown) => void;
}

/**
 * Merges single lookups made in the same tick into one request. Ten
 * `getById()` calls fired together cost one HTTP call instead of ten.
 */
export class Batcher<V> {
  readonly #load: (keys: string[]) => Promise<Map<string, V>>;
  readonly #max: number;
  #queue = new Map<string, Waiter<V>[]>();
  #scheduled = false;

  constructor(load: (keys: string[]) => Promise<Map<string, V>>, max = 100) {
    this.#load = load;
    this.#max = max;
  }

  /** Resolves with the value for `key`, or `null` when the lookup found nothing. */
  get(key: string): Promise<V | null> {
    return new Promise((resolve, reject) => {
      const waiters = this.#queue.get(key);
      if (waiters) waiters.push({ resolve, reject });
      else this.#queue.set(key, [{ resolve, reject }]);
      if (!this.#scheduled) {
        this.#scheduled = true;
        queueMicrotask(() => this.#flush());
      }
    });
  }

  #flush(): void {
    const queue = this.#queue;
    this.#queue = new Map();
    this.#scheduled = false;
    for (const keys of chunk([...queue.keys()], this.#max)) {
      this.#load(keys).then(
        (found) => {
          for (const key of keys) for (const waiter of queue.get(key)!) waiter.resolve(found.get(key) ?? null);
        },
        (error) => {
          for (const key of keys) for (const waiter of queue.get(key)!) waiter.reject(error);
        },
      );
    }
  }
}
