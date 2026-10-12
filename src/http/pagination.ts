/** What one fetched page boils down to. Internal. */
export interface PageResult<T, R> {
  /** Items of the page. */
  data: T[];
  /** Cursor of the following page, when there is one. */
  cursor: string | undefined;
  /** Total reported by Twitch, when the endpoint gives one. */
  total: number | undefined;
  /** The response body as Twitch sent it. */
  raw: R;
}

/** Fetches one page. `cursor` is `undefined` for the first one. Internal. */
export type PageFetcher<T, R> = (cursor: string | undefined, size: number | undefined) => Promise<PageResult<T, R>>;

/** One page of results. */
export class Page<T, R = unknown> implements Iterable<T> {
  /** Items of this page. */
  readonly data: T[];
  /** Cursor of the following page, or `undefined` on the last one. */
  readonly cursor: string | undefined;
  /** Total number of items across all pages, for the endpoints that report it. */
  readonly total: number | undefined;
  /** The response body exactly as Twitch sent it. */
  readonly raw: R;
  readonly #fetch: PageFetcher<T, R>;
  readonly #size: number | undefined;

  /** @internal */
  constructor(result: PageResult<T, R>, fetch: PageFetcher<T, R>, size: number | undefined) {
    this.data = result.data;
    this.cursor = result.cursor;
    this.total = result.total;
    this.raw = result.raw;
    this.#fetch = fetch;
    this.#size = size;
  }

  /** Whether another page follows. */
  get hasNext(): boolean {
    return this.cursor !== undefined;
  }

  /** Fetches the following page, or resolves with `null` on the last one. */
  async next(): Promise<Page<T, R> | null> {
    if (this.cursor === undefined) return null;
    return new Page(await this.#fetch(this.cursor, this.#size), this.#fetch, this.#size);
  }

  /** Iterates over the items of this page. */
  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]();
  }
}

/**
 * The result of every paginated endpoint. Nothing is fetched until you use it.
 *
 * @example
 * // One page:
 * const page = await twitch.streams.get({ language: "fr" });
 * console.log(page.data, page.cursor);
 *
 * // Every item, page after page:
 * for await (const stream of twitch.streams.get({ language: "fr" })) {
 *   console.log(stream.user_name);
 * }
 *
 * // Collected into an array:
 * const top = await twitch.streams.get().all({ limit: 250 });
 */
export class Paginator<T, R = unknown> implements PromiseLike<Page<T, R>>, AsyncIterable<T> {
  readonly #fetch: PageFetcher<T, R>;
  readonly #size: number | undefined;
  readonly #maxSize: number;
  #first: Promise<Page<T, R>> | undefined;

  /** @internal */
  constructor(fetch: PageFetcher<T, R>, size: number | undefined, maxSize: number) {
    this.#fetch = fetch;
    this.#size = size;
    this.#maxSize = maxSize;
  }

  /** Awaiting a paginator fetches its first page. */
  then<A = Page<T, R>, B = never>(
    onfulfilled?: ((page: Page<T, R>) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    this.#first ??= this.#fetch(undefined, this.#size).then((result) => new Page(result, this.#fetch, this.#size));
    return this.#first.then(onfulfilled, onrejected);
  }

  /**
   * Walks through every page. Unless you set `first` yourself, pages are
   * requested at the largest size the endpoint allows to save round trips.
   */
  async *pages(): AsyncGenerator<Page<T, R>, void, undefined> {
    const size = this.#size ?? this.#maxSize;
    let page: Page<T, R> | null = new Page(await this.#fetch(undefined, size), this.#fetch, size);
    const seen = new Set<string>();
    while (page) {
      yield page;
      // Twitch sometimes hands back a cursor it already gave: stop instead of looping forever.
      if (page.cursor === undefined || seen.has(page.cursor)) return;
      seen.add(page.cursor);
      page = await page.next();
    }
  }

  /** Walks through every item of every page. */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    for await (const page of this.pages()) yield* page.data;
  }

  /**
   * Collects items into an array. Without a `limit` it reads until the last
   * page, so set one on large lists.
   */
  async all(options: { limit?: number } = {}): Promise<T[]> {
    const limit = options.limit ?? Infinity;
    const items: T[] = [];
    if (limit <= 0) return items;
    const size = this.#size ?? Math.min(this.#maxSize, limit);
    let cursor: string | undefined;
    const seen = new Set<string>();
    for (;;) {
      const result = await this.#fetch(cursor, size);
      for (const item of result.data) {
        items.push(item);
        if (items.length >= limit) return items;
      }
      if (result.cursor === undefined || seen.has(result.cursor)) return items;
      seen.add(result.cursor);
      cursor = result.cursor;
    }
  }

  /** Collects the first `count` items. */
  take(count: number): Promise<T[]> {
    return this.all({ limit: count });
  }

  /** Resolves with the first item, or `undefined` when the list is empty. */
  async first(): Promise<T | undefined> {
    const size = this.#size ?? 1;
    return (await this.#fetch(undefined, size)).data[0];
  }

  /**
   * Resolves with the total reported by Twitch (follower count, subscriber
   * count...) using the smallest possible request. `undefined` when the
   * endpoint does not report one.
   */
  async total(): Promise<number | undefined> {
    return (await this.#fetch(undefined, 1)).total;
  }
}
