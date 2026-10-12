import { TwitchApiError } from "../errors.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** What every team listing says about a team. */
export interface TeamInfo {
  /** URL of the background image, or `null` when the team has none. */
  background_image_url: string | null;
  /** URL of the banner, or `null` when the team has none. */
  banner: string | null;
  /** When the team was created, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the team was last changed, as an RFC 3339 timestamp. */
  updated_at: string;
  /** Description of the team. May hold HTML, Markdown and line breaks. */
  info: string;
  /** URL of the team logo. */
  thumbnail_url: string;
  /** Name of the team: the one that appears in URLs. */
  team_name: string;
  /** Display name of the team. */
  team_display_name: string;
  /** ID of the team. */
  id: string;
}

/** A team a broadcaster belongs to. */
export interface ChannelTeam extends TeamInfo {
  /** ID of the broadcaster. */
  broadcaster_id: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
}

/** A member of a team. */
export interface TeamMember {
  /** ID of the member. */
  user_id: string;
  /** Login name of the member. */
  user_login: string;
  /** Display name of the member. */
  user_name: string;
}

/** A team with its members. */
export interface Team extends TeamInfo {
  /** Members of the team. */
  users: TeamMember[];
}

/** Parameters of {@link TeamsApi.ofChannel}. */
export interface GetChannelTeamsParams {
  /** Broadcaster whose teams to list. */
  broadcaster_id: string;
}

/** Parameters of {@link TeamsApi.get}. Give either `name` or `id`, not both. */
export interface GetTeamsParams {
  /** Name of the team. */
  name?: string;
  /** ID of the team. */
  id?: string;
}

/** Teams: look one up, list the teams of a channel. */
export class TeamsApi extends ApiGroup {
  /**
   * Lists the teams a broadcaster is a member of. The list is empty when
   * there are none.
   *
   * Token: app or user.
   *
   * @example
   * const teams = await twitch.teams.ofChannel({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-teams
   */
  ofChannel(params: GetChannelTeamsParams, options?: RequestOptions): Promise<ChannelTeam[]> {
    return this.rest.data<ChannelTeam>({ path: "teams/channel", query: params, options });
  }

  /**
   * Gets a team and its members, by name or by ID. Resolves with `null` when
   * Twitch returns no team.
   *
   * Token: app or user.
   *
   * @example
   * const team = await twitch.teams.get({ name: "livecoders" });
   * console.log(team?.users.length);
   * @see https://dev.twitch.tv/docs/api/reference/#get-teams
   */
  async get(params: GetTeamsParams, options?: RequestOptions): Promise<Team | null> {
    try {
      return await this.rest.first<Team>({ path: "teams", query: params, options });
    } catch (error) {
      // Twitch answers 404 for a team that does not exist.
      if (error instanceof TwitchApiError && error.status === 404) return null;
      throw error;
    }
  }
}
