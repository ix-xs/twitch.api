import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** The category planned for a scheduled broadcast. */
export interface ScheduleCategory {
  /** ID of the category. */
  id: string;
  /** Name of the category. */
  name: string;
}

/** One planned broadcast of a channel's schedule. */
export interface ScheduleSegment {
  /** ID of the segment. */
  id: string;
  /** When the broadcast starts, as an RFC 3339 timestamp. */
  start_time: string;
  /** When the broadcast ends, as an RFC 3339 timestamp. */
  end_time: string;
  /** Title of the broadcast. */
  title: string;
  /**
   * Set when this occurrence of a recurring broadcast was canceled: it then
   * holds the same RFC 3339 timestamp as `end_time`. `null` otherwise.
   */
  canceled_until: string | null;
  /** Category planned for the broadcast, or `null` when none was chosen. */
  category: ScheduleCategory | null;
  /** Whether the broadcast repeats every week. `false` for a one-time broadcast. */
  is_recurring: boolean;
}

/** A period during which the broadcaster does not stream. */
export interface ScheduleVacation {
  /** When the vacation starts, as an RFC 3339 timestamp. */
  start_time: string;
  /** When the vacation ends, as an RFC 3339 timestamp. */
  end_time: string;
}

/** The stream schedule of a channel. */
export interface Schedule {
  /** Planned broadcasts. */
  segments: ScheduleSegment[];
  /** ID of the broadcaster who owns the schedule. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Planned vacation, or `null` when vacation mode is off. */
  vacation: ScheduleVacation | null;
}

/** Body of one page of {@link ScheduleApi.get}, reachable through `page.raw`. */
export interface ScheduleResponse {
  /** The schedule, holding the segments of this page. */
  data: Schedule;
  /** Holds the cursor of the following page. Empty on the last one. */
  pagination?: {
    /** Cursor of the following page. */
    cursor?: string;
  };
}

/** Parameters of {@link ScheduleApi.get}. */
export interface GetScheduleParams {
  /** Broadcaster whose schedule to read. */
  broadcaster_id: string;
  /** Only these segments. Up to 100 IDs. */
  id?: string | readonly string[];
  /** Only segments that start after this moment. Twitch defaults to now. */
  start_time?: string | Date;
  /** Items per page, 1 to 25. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ScheduleApi.icalendar}. */
export interface GetScheduleICalendarParams {
  /** Broadcaster whose schedule to export. */
  broadcaster_id: string;
}

/** Parameters of {@link ScheduleApi.updateSettings}. */
export interface UpdateScheduleSettingsParams {
  /** Broadcaster who owns the schedule. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** `true` to plan a vacation with the dates below, `false` to cancel the planned one. */
  is_vacation_enabled?: boolean;
  /** When the vacation starts. Required when `is_vacation_enabled` is `true`. */
  vacation_start_time?: string | Date;
  /** When the vacation ends. Required when `is_vacation_enabled` is `true`. */
  vacation_end_time?: string | Date;
  /**
   * Time zone the broadcaster streams from, as an IANA name such as
   * `"Europe/Paris"`. Required when `is_vacation_enabled` is `true`.
   */
  timezone?: string;
}

/** Parameters of {@link ScheduleApi.createSegment}. */
export interface CreateScheduleSegmentParams {
  /** Broadcaster who owns the schedule. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** When the broadcast starts. */
  start_time: string | Date;
  /** Time zone of the broadcast, as an IANA name such as `"Europe/Paris"`. */
  timezone: string;
  /** Length of the broadcast in minutes, written as a string: `"30"` to `"1380"`. */
  duration: string;
  /** Whether the broadcast repeats every week. One-time broadcasts are reserved to affiliates and partners. */
  is_recurring?: boolean;
  /** ID of the category planned for the broadcast. */
  category_id?: string;
  /** Title of the broadcast, 140 characters at most. */
  title?: string;
}

/** Parameters of {@link ScheduleApi.updateSegment}. */
export interface UpdateScheduleSegmentParams {
  /** Broadcaster who owns the schedule. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the segment to change. */
  id: string;
  /** New start. Only affiliates and partners can move a segment, and only a one-time one. */
  start_time?: string | Date;
  /** New length in minutes, written as a string: `"30"` to `"1380"`. */
  duration?: string;
  /** ID of the new category. */
  category_id?: string;
  /** New title, 140 characters at most. */
  title?: string;
  /**
   * `true` to cancel the broadcast. On a recurring segment this cancels the
   * next occurrence, whichever occurrence `id` points to.
   */
  is_canceled?: boolean;
  /** New time zone, as an IANA name such as `"Europe/Paris"`. */
  timezone?: string;
}

/** Parameters of {@link ScheduleApi.deleteSegment}. */
export interface DeleteScheduleSegmentParams {
  /** Broadcaster who owns the schedule. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the segment to remove. */
  id: string;
}

/** Stream schedule: segments, vacation and the iCalendar feed. */
export class ScheduleApi extends ApiGroup {
  /**
   * Lists the planned broadcasts of a channel. The broadcaster and vacation
   * fields come with every page, under `page.raw.data`. Fails with a 404 when
   * the channel has no schedule.
   *
   * Token: app or user.
   *
   * @example
   * const page = await twitch.schedule.get({ broadcaster_id: "141981764" });
   * console.log(page.raw.data.vacation);
   * for (const segment of page) console.log(segment.start_time, segment.title);
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-stream-schedule
   */
  get(params: GetScheduleParams, options?: RequestOptions): Paginator<ScheduleSegment, ScheduleResponse> {
    return this.rest.paginate<ScheduleSegment, ScheduleResponse>(
      { path: "schedule", query: params, options },
      { max: 25, extract: (body) => ({ data: body.data.segments, cursor: body.pagination?.cursor }) },
    );
  }

  /**
   * Gets the schedule of a channel as iCalendar text, ready to be saved as an
   * `.ics` file. Twitch does not ask for a token here, the client sends its
   * usual one anyway.
   *
   * Token: app or user.
   *
   * @example
   * const ics = await twitch.schedule.icalendar({ broadcaster_id: "141981764" });
   * @see https://dev.twitch.tv/docs/api/reference/#get-channel-icalendar
   */
  icalendar(params: GetScheduleICalendarParams, options?: RequestOptions): Promise<string> {
    return this.rest.request<string>({ path: "schedule/icalendar", query: params, response: "text", options });
  }

  /**
   * Plans or cancels the vacation of a channel.
   *
   * Token: user, scope `channel:manage:schedule`.
   *
   * @example
   * await twitch.schedule.updateSettings({
   *   is_vacation_enabled: true,
   *   vacation_start_time: "2026-08-01T00:00:00Z",
   *   vacation_end_time: "2026-08-15T00:00:00Z",
   *   timezone: "Europe/Paris",
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-channel-stream-schedule
   */
  updateSettings(params: UpdateScheduleSettingsParams = {}, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "PATCH",
      path: "schedule/settings",
      query: params,
      auth: "user",
      scopes: ["channel:manage:schedule"],
      context: "broadcaster_id",
      options,
    });
  }

  /**
   * Adds a one-time or weekly broadcast to the schedule of a channel. Resolves
   * with the schedule, whose `segments` hold only the new one.
   *
   * Token: user, scope `channel:manage:schedule`.
   *
   * @example
   * const schedule = await twitch.schedule.createSegment({
   *   start_time: "2026-07-01T18:00:00Z",
   *   timezone: "Europe/Paris",
   *   duration: "120",
   *   is_recurring: true,
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#create-channel-stream-schedule-segment
   */
  async createSegment(params: CreateScheduleSegmentParams, options?: RequestOptions): Promise<Schedule> {
    const { broadcaster_id, ...body } = params;
    const response = await this.rest.request<{ data: Schedule }>({
      method: "POST",
      path: "schedule/segment",
      query: { broadcaster_id },
      body,
      auth: "user",
      scopes: ["channel:manage:schedule"],
      context: "broadcaster_id",
      options,
    });
    return response.data;
  }

  /**
   * Changes or cancels a planned broadcast. On a recurring segment, a new
   * title, category, duration or time zone applies to every occurrence.
   * Resolves with the schedule, whose `segments` hold only the changed one.
   *
   * Token: user, scope `channel:manage:schedule`.
   *
   * @example
   * await twitch.schedule.updateSegment({ id: segment.id, duration: "90" });
   * @see https://dev.twitch.tv/docs/api/reference/#update-channel-stream-schedule-segment
   */
  async updateSegment(params: UpdateScheduleSegmentParams, options?: RequestOptions): Promise<Schedule> {
    const { broadcaster_id, id, ...body } = params;
    const response = await this.rest.request<{ data: Schedule }>({
      method: "PATCH",
      path: "schedule/segment",
      query: { broadcaster_id, id },
      body,
      auth: "user",
      scopes: ["channel:manage:schedule"],
      context: "broadcaster_id",
      options,
    });
    return response.data;
  }

  /**
   * Removes a planned broadcast. Removing a recurring segment removes every
   * occurrence of it.
   *
   * Token: user, scope `channel:manage:schedule`.
   *
   * @example
   * await twitch.schedule.deleteSegment({ id: segment.id });
   * @see https://dev.twitch.tv/docs/api/reference/#delete-channel-stream-schedule-segment
   */
  deleteSegment(params: DeleteScheduleSegmentParams, options?: RequestOptions): Promise<void> {
    return this.rest.send({
      method: "DELETE",
      path: "schedule/segment",
      query: params,
      auth: "user",
      scopes: ["channel:manage:schedule"],
      context: "broadcaster_id",
      options,
    });
  }
}
