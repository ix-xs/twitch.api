import type { TwitchEvents } from "../events.js";
import { type Emitter, sleep } from "../util.js";

interface Bucket {
  limit: number;
  remaining: number;
  /** Epoch milliseconds. */
  resetAt: number;
}

/**
 * Follows the `Ratelimit-*` headers of each bucket (the app token and every
 * user token have their own) and holds requests back when a bucket is empty,
 * so a 429 is the exception and not the way the limit is discovered.
 */
export class RateLimiter {
  readonly #buckets = new Map<string, Bucket>();
  readonly #events: Emitter<TwitchEvents>;

  constructor(events: Emitter<TwitchEvents>) {
    this.#events = events;
  }

  /** Current state of a bucket, if Twitch has reported it yet. */
  get(bucket: string): Readonly<Bucket> | undefined {
    return this.#buckets.get(bucket);
  }

  /**
   * Reserves one point. Resolves with the time to wait before sending, in
   * milliseconds: `0` when the bucket has room.
   */
  reserve(bucket: string): number {
    const state = this.#buckets.get(bucket);
    if (!state) return 0;
    const now = Date.now();
    if (now >= state.resetAt) {
      // The reset time has passed: the bucket is full again. One marked empty
      // after a 429, whose size is unknown, is forgotten until Twitch reports it.
      if (state.limit === 0) this.#buckets.delete(bucket);
      else state.remaining = state.limit;
      return 0;
    }
    if (state.remaining > 0) {
      state.remaining--;
      return 0;
    }
    return state.resetAt - now;
  }

  /** Waits until the bucket has room, announcing the wait on the `rateLimit` event. */
  async acquire(bucket: string, signal?: AbortSignal): Promise<void> {
    for (;;) {
      const waitMs = this.reserve(bucket);
      if (waitMs <= 0) return;
      this.#events.emit("rateLimit", { bucket, waitMs, resetAt: Date.now() + waitMs });
      await sleep(waitMs + 25, signal);
    }
  }

  /** Records what Twitch says about the bucket. Returns the points left, when reported. */
  update(bucket: string, headers: Headers): number | undefined {
    const limit = Number(headers.get("ratelimit-limit"));
    const remainingHeader = headers.get("ratelimit-remaining");
    const reset = Number(headers.get("ratelimit-reset"));
    if (!limit || remainingHeader === null || !reset) return undefined;
    const remaining = Number(remainingHeader);
    const resetAt = reset * 1000;
    const state = this.#buckets.get(bucket);
    if (state && state.resetAt === resetAt) {
      // Responses can arrive out of order: within one window, trust the lowest count.
      state.limit = limit;
      state.remaining = Math.min(state.remaining, remaining);
    } else {
      this.#buckets.set(bucket, { limit, remaining, resetAt });
    }
    return remaining;
  }

  /** Marks a bucket as empty until `resetAt`, after a 429. */
  exhaust(bucket: string, resetAt: number): void {
    const state = this.#buckets.get(bucket);
    if (state) {
      state.remaining = 0;
      state.resetAt = Math.max(state.resetAt, resetAt);
    } else {
      this.#buckets.set(bucket, { limit: 0, remaining: 0, resetAt });
    }
  }
}
