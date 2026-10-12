/**
 * Node.js only helpers. Import them from `@ix-xs/twitch.api/node` so the main
 * entry point stays free of Node.js built-ins and runs on every runtime.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { TokenStore, UserToken } from "./auth/tokens.js";

/**
 * Persists user tokens in a JSON file. Writes are atomic (a temporary file
 * renamed into place) and serialised, so a crash or two refreshes at once
 * never leave a broken file behind. The file is created with owner-only
 * permissions where the platform supports them.
 *
 * Add the file to your `.gitignore`: it holds credentials.
 *
 * @example
 * import { Twitch } from "@ix-xs/twitch.api";
 * import { FileTokenStore } from "@ix-xs/twitch.api/node";
 *
 * const twitch = new Twitch({
 *   clientId,
 *   clientSecret,
 *   tokens: new FileTokenStore("./tokens.json"),
 * });
 */
export class FileTokenStore implements TokenStore {
  /** Absolute path of the file. */
  readonly path: string;
  #cache: Promise<Record<string, UserToken>> | undefined;
  #queue: Promise<void> = Promise.resolve();

  constructor(path = "./tokens.json") {
    this.path = resolve(path);
  }

  /** Returns the token saved for `userId`, if any. */
  async get(userId: string): Promise<UserToken | undefined> {
    return (await this.#read())[userId];
  }

  /** Saves or replaces the token of `userId`, then writes the file. */
  async set(userId: string, token: UserToken): Promise<void> {
    const tokens = await this.#read();
    tokens[userId] = token;
    await this.#write();
  }

  /** Forgets the token of `userId`, then writes the file. */
  async delete(userId: string): Promise<void> {
    const tokens = await this.#read();
    if (!(userId in tokens)) return;
    delete tokens[userId];
    await this.#write();
  }

  /** Returns every saved user ID. */
  async list(): Promise<string[]> {
    return Object.keys(await this.#read());
  }

  /** Loads the file once. Callers that arrive while it is loading share the same read. */
  #read(): Promise<Record<string, UserToken>> {
    return (this.#cache ??= (async () => {
      try {
        const parsed: unknown = JSON.parse(await readFile(this.path, "utf8"));
        return parsed && typeof parsed === "object" ? (parsed as Record<string, UserToken>) : {};
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
        // An unreadable file must be read again next time, not remembered as a failure.
        this.#cache = undefined;
        throw error;
      }
    })());
  }

  #write(): Promise<void> {
    const run = this.#queue.then(async () => {
      const temporary = `${this.path}.${process.pid}.tmp`;
      await mkdir(dirname(this.path), { recursive: true });
      await writeFile(temporary, `${JSON.stringify(await this.#read(), null, 2)}\n`, { mode: 0o600 });
      await rename(temporary, this.path);
    });
    this.#queue = run.catch(() => {});
    return run;
  }
}
