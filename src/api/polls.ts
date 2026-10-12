import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** One answer viewers can vote for in a poll. */
export interface PollChoice {
  /** ID of the choice. */
  id: string;
  /** Text of the choice, 25 characters at most. */
  title: string;
  /** Votes received, all kinds together. */
  votes: number;
  /** Votes that were paid for with Channel Points. */
  channel_points_votes: number;
  /** @deprecated Always 0. Bits voting no longer exists. */
  bits_votes: number;
}

/** State of a poll. */
export type PollStatus = "ACTIVE" | "COMPLETED" | "TERMINATED" | "ARCHIVED" | "MODERATED" | "INVALID";

/** A poll run in a channel. */
export interface Poll {
  /** ID of the poll. */
  id: string;
  /** ID of the broadcaster who ran the poll. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Question put to the viewers, 60 characters at most. */
  title: string;
  /** Choices of the poll, two to five of them. */
  choices: PollChoice[];
  /** @deprecated Always `false`. Bits voting no longer exists. */
  bits_voting_enabled: boolean;
  /** @deprecated Always 0. Bits voting no longer exists. */
  bits_per_vote: number;
  /** Whether viewers can buy extra votes with Channel Points. */
  channel_points_voting_enabled: boolean;
  /** Price of one extra vote, in Channel Points. */
  channel_points_per_vote: number;
  /**
   * State of the poll: `ACTIVE` while it runs, `COMPLETED` when it reached its
   * end, `TERMINATED` when it was stopped early, `ARCHIVED` when it is hidden
   * from the channel, `MODERATED` when it was deleted, `INVALID` when Twitch
   * could not work it out.
   */
  status: PollStatus;
  /** Planned length of the poll, in seconds. */
  duration: number;
  /** When the poll started, as an RFC 3339 timestamp. */
  started_at: string;
  /** When the poll ended, as an RFC 3339 timestamp. `null` or absent while it is running. */
  ended_at?: string | null;
}

/** Parameters of {@link PollsApi.get}. */
export interface GetPollsParams {
  /** Broadcaster whose polls to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these polls. Up to 20 IDs. */
  id?: string | readonly string[];
  /** Items per page, 1 to 20. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link PollsApi.create}. */
export interface CreatePollParams {
  /** Broadcaster who runs the poll. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Question put to the viewers, 60 characters at most. */
  title: string;
  /** Two to five choices, each 25 characters at most. Plain strings work too. */
  choices: readonly (string | { title: string })[];
  /** Length of the poll in seconds, 15 to 1800. */
  duration: number;
  /** Lets viewers buy extra votes with Channel Points. Twitch defaults to `false`. */
  channel_points_voting_enabled?: boolean;
  /** Price of one extra vote in Channel Points, 1 to 1000000. */
  channel_points_per_vote?: number;
}

/** Parameters of {@link PollsApi.end}. */
export interface EndPollParams {
  /** Broadcaster who runs the poll. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the poll to end. */
  id: string;
  /** `"TERMINATED"` leaves the results on screen, `"ARCHIVED"` also hides the poll. */
  status: "TERMINATED" | "ARCHIVED";
}

/** Polls: create, read and end them. */
export class PollsApi extends ApiGroup {
  /**
   * Lists the polls of a channel, most recent first. Twitch keeps them for 90
   * days.
   *
   * Token: user, scope `channel:read:polls` or `channel:manage:polls`.
   *
   * @example
   * const latest = await twitch.polls.get().first();
   * @see https://dev.twitch.tv/docs/api/reference/#get-polls
   */
  get(params: GetPollsParams = {}, options?: RequestOptions): Paginator<Poll> {
    return this.rest.paginate<Poll>(
      {
        path: "polls",
        query: params,
        auth: "user",
        scopes: ["channel:read:polls", "channel:manage:polls"],
        context: "broadcaster_id",
        options,
      },
      { max: 20 },
    );
  }

  /**
   * Starts a poll in a channel. It opens at once, and a channel can only run
   * one poll at a time.
   *
   * Token: user, scope `channel:manage:polls`.
   *
   * @example
   * const poll = await twitch.polls.create({
   *   title: "Which game next?",
   *   choices: ["Celeste", "Hades", "Outer Wilds"],
   *   duration: 120,
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#create-poll
   */
  create(params: CreatePollParams, options?: RequestOptions): Promise<Poll> {
    return this.rest.one<Poll>({
      method: "POST",
      path: "polls",
      body: {
        ...params,
        choices: params.choices.map((choice) => (typeof choice === "string" ? { title: choice } : choice)),
      },
      auth: "user",
      scopes: ["channel:manage:polls"],
      context: { body: "broadcaster_id" },
      options,
    });
  }

  /**
   * Ends a running poll before its time is up, and optionally hides it.
   *
   * Token: user, scope `channel:manage:polls`.
   *
   * @example
   * const poll = await twitch.polls.end({ id: pollId, status: "TERMINATED" });
   * @see https://dev.twitch.tv/docs/api/reference/#end-poll
   */
  end(params: EndPollParams, options?: RequestOptions): Promise<Poll> {
    return this.rest.one<Poll>({
      method: "PATCH",
      path: "polls",
      body: params,
      auth: "user",
      scopes: ["channel:manage:polls"],
      context: { body: "broadcaster_id" },
      options,
    });
  }
}
