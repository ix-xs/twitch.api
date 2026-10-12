import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** The kinds of analytics report Twitch produces. */
export type AnalyticsReportType = "overview_v2";

/** The days an analytics report covers. */
export interface AnalyticsDateRange {
  /** First day of the report, as an RFC 3339 timestamp. */
  started_at: string;
  /** Last day of the report, as an RFC 3339 timestamp. */
  ended_at: string;
}

/** A downloadable report about one extension. */
export interface ExtensionAnalyticsReport {
  /** ID of the extension the report is about. */
  extension_id: string;
  /** URL of the CSV file. It stops working after 5 minutes. */
  URL: string;
  /** Kind of report. */
  type: AnalyticsReportType;
  /** The days the report covers. */
  date_range: AnalyticsDateRange;
}

/** Parameters of {@link AnalyticsApi.extensions}. */
export interface GetExtensionAnalyticsParams {
  /** Only this extension. Without it you get one report per extension the user owns. */
  extension_id?: string;
  /** Kind of report. */
  type?: AnalyticsReportType;
  /**
   * First day of the report, at midnight UTC. Goes with `ended_at`: set both
   * or neither. Days before January 31, 2018 are not available.
   */
  started_at?: string | Date;
  /**
   * Last day of the report, at midnight UTC, included. Twitch pulls it back
   * when it is too recent, since data takes up to two days to arrive.
   */
  ended_at?: string | Date;
  /** Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. */
  first?: number;
  /** Cursor of the next page. Ignored when `extension_id` is set. */
  after?: string;
}

/** A downloadable report about one game. */
export interface GameAnalyticsReport {
  /** ID of the game the report is about. */
  game_id: string;
  /** URL of the CSV file. It stops working after 5 minutes. */
  URL: string;
  /** Kind of report. */
  type: AnalyticsReportType;
  /** The days the report covers. */
  date_range: AnalyticsDateRange;
}

/** Parameters of {@link AnalyticsApi.games}. */
export interface GetGameAnalyticsParams {
  /** Only this game. Without it you get one report per game the user owns. */
  game_id?: string;
  /** Kind of report. */
  type?: AnalyticsReportType;
  /**
   * First day of the report, at midnight UTC. Goes with `ended_at`: set both
   * or neither. Days older than one year are not available.
   */
  started_at?: string | Date;
  /**
   * Last day of the report, at midnight UTC, included. Twitch pulls it back
   * when it is too recent, since data takes up to two days to arrive.
   */
  ended_at?: string | Date;
  /** Items per page, 1 to 100. Twitch defaults to 20, and never sends more than 20 whatever you ask. */
  first?: number;
  /** Cursor of the next page. Ignored when `game_id` is set. */
  after?: string;
}

/** Analytics: downloadable reports for your extensions and games. */
export class AnalyticsApi extends ApiGroup {
  /**
   * Lists the reports available for the extensions of the user making the
   * call. Each one is a link to a CSV file with one row per day of use.
   *
   * Token: user, scope `analytics:read:extensions`.
   *
   * @example
   * const reports = await twitch.analytics.extensions().all();
   * for (const report of reports) console.log(report.extension_id, report.URL);
   * @see https://dev.twitch.tv/docs/api/reference/#get-extension-analytics
   */
  extensions(
    params: GetExtensionAnalyticsParams = {},
    options?: RequestOptions,
  ): Paginator<ExtensionAnalyticsReport> {
    return this.rest.paginate<ExtensionAnalyticsReport>({
      path: "analytics/extensions",
      query: params,
      auth: "user",
      scopes: ["analytics:read:extensions"],
      options,
    });
  }

  /**
   * Lists the reports available for the games of the user making the call.
   * Each one is a link to a CSV file with one row per day. A game needs at
   * least 5 hours of broadcast over the period to get a report.
   *
   * Token: user, scope `analytics:read:games`.
   *
   * @example
   * const [report] = (await twitch.analytics.games({ game_id: "493057" })).data;
   * @see https://dev.twitch.tv/docs/api/reference/#get-game-analytics
   */
  games(params: GetGameAnalyticsParams = {}, options?: RequestOptions): Paginator<GameAnalyticsReport> {
    return this.rest.paginate<GameAnalyticsReport>({
      path: "analytics/games",
      query: params,
      auth: "user",
      scopes: ["analytics:read:games"],
      options,
    });
  }
}
