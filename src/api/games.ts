import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A game or another streaming category. */
export interface Game {
  /** ID of the category. */
  id: string;
  /** Name of the category. */
  name: string;
  /** URL of the box art. Replace `{width}` and `{height}` with the size you want, in pixels. */
  box_art_url: string;
  /** ID of the game on IGDB. An empty string when Twitch does not know it. */
  igdb_id: string;
}

/** Parameters of {@link GamesApi.top}. */
export interface GetTopGamesParams {
  /** Items per page, 1 to 100. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
  /** Cursor of the previous page. */
  before?: string;
}

/** Parameters of {@link GamesApi.get}. Give at least one of the three. */
export interface GetGamesParams {
  /** IDs of the categories to get. Any number: long lists are split for you. */
  id?: string | readonly string[];
  /** Exact names of the categories to get. Any number: long lists are split for you. */
  name?: string | readonly string[];
  /** IGDB IDs of the games to get. Any number: long lists are split for you. */
  igdb_id?: string | readonly string[];
}

/** Games and categories: look them up, list the most watched. */
export class GamesApi extends ApiGroup {
  /**
   * Lists the categories with the most viewers right now, most watched first.
   *
   * Token: app or user.
   *
   * @example
   * const top = await twitch.games.top().take(10);
   * @see https://dev.twitch.tv/docs/api/reference/#get-top-games
   */
  top(params: GetTopGamesParams = {}, options?: RequestOptions): Paginator<Game> {
    return this.rest.paginate<Game>({ path: "games/top", query: params, options });
  }

  /**
   * Gets categories by ID, by exact name, by IGDB ID, or any mix of them.
   * Categories that do not exist are left out of the result.
   *
   * Token: app or user.
   *
   * @example
   * const [game] = await twitch.games.get({ name: "Fortnite" });
   * const games = await twitch.games.get({ id: ["33214", "509658"] });
   * @see https://dev.twitch.tv/docs/api/reference/#get-games
   */
  get(params: GetGamesParams, options?: RequestOptions): Promise<Game[]> {
    return this.rest.chunked<Game>({ path: "games", query: params, options }, ["id", "name", "igdb_id"]);
  }
}
