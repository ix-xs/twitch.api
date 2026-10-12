import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** Parameters of {@link WhispersApi.send}. */
export interface SendWhisperParams {
  /** User who sends the whisper. Their account needs a verified phone number. Defaults to the user making the call. */
  from_user_id?: string;
  /** User who receives the whisper. */
  to_user_id: string;
  /**
   * Text of the whisper. Twitch cuts it at 500 characters when the recipient
   * never whispered the sender, at 10,000 otherwise.
   */
  message: string;
}

/** Whispers: send a private message to a user. */
export class WhispersApi extends ApiGroup {
  /**
   * Sends a whisper to a user. Twitch can discard a whisper it finds
   * suspicious and still report success, so a resolved call is no proof of
   * delivery. Limited to 40 different recipients per day, 3 whispers per
   * second and 100 per minute.
   *
   * Token: user, scope `user:manage:whispers`.
   *
   * @example
   * await twitch.whispers.send({ to_user_id: "198704263", message: "Thanks for the raid" });
   * @see https://dev.twitch.tv/docs/api/reference/#send-whisper
   */
  send(params: SendWhisperParams, options?: RequestOptions): Promise<void> {
    const { message, ...query } = params;
    return this.rest.send({
      method: "POST",
      path: "whispers",
      query,
      body: { message },
      auth: "user",
      scopes: ["user:manage:whispers"],
      context: "from_user_id",
      options,
    });
  }
}
