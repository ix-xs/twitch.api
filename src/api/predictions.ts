import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A viewer among those who bet the most on an outcome. */
export interface PredictionTopPredictor {
  /** ID of the viewer. */
  user_id: string;
  /** Display name of the viewer. */
  user_name: string;
  /** Login name of the viewer. */
  user_login: string;
  /** Channel Points the viewer bet. */
  channel_points_used: number;
  /** Channel Points the viewer received. */
  channel_points_won: number;
}

/** One outcome viewers can bet on in a prediction. */
export interface PredictionOutcome {
  /** ID of the outcome. */
  id: string;
  /** Text of the outcome. */
  title: string;
  /** Number of viewers who picked this outcome. */
  users: number;
  /** Channel Points bet on this outcome. */
  channel_points: number;
  /** Viewers who bet the most on this outcome, or `null` when nobody did. */
  top_predictors: PredictionTopPredictor[] | null;
  /**
   * Colour of the outcome in the Twitch interface. With two outcomes the first
   * is blue and the second pink. With more, all of them are blue.
   */
  color: "BLUE" | "PINK";
}

/** State of a prediction. */
export type PredictionStatus = "ACTIVE" | "CANCELED" | "LOCKED" | "RESOLVED";

/** A Channel Points prediction run in a channel. */
export interface Prediction {
  /** ID of the prediction. */
  id: string;
  /** ID of the broadcaster who ran the prediction. */
  broadcaster_id: string;
  /** Display name of the broadcaster. */
  broadcaster_name: string;
  /** Login name of the broadcaster. */
  broadcaster_login: string;
  /** Question the viewers bet on. */
  title: string;
  /** ID of the outcome that won. `null` until the prediction is resolved. */
  winning_outcome_id: string | null;
  /** Outcomes viewers can pick. */
  outcomes: PredictionOutcome[];
  /** How long viewers can bet, in seconds. */
  prediction_window: number;
  /**
   * State of the prediction: `ACTIVE` while bets are open, `LOCKED` once they
   * are closed, `RESOLVED` when a winner was picked and points paid out,
   * `CANCELED` when everyone was refunded.
   */
  status: PredictionStatus;
  /** When the prediction started, as an RFC 3339 timestamp. */
  created_at: string;
  /** When the prediction ended, as an RFC 3339 timestamp. `null` while it is active. */
  ended_at: string | null;
  /** When bets were closed, as an RFC 3339 timestamp. `null` when the prediction is not locked. */
  locked_at: string | null;
}

/** Parameters of {@link PredictionsApi.get}. */
export interface GetPredictionsParams {
  /** Broadcaster whose predictions to list. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Only these predictions. Up to 25 IDs. */
  id?: string | readonly string[];
  /** Items per page, 1 to 25. Twitch defaults to 20. */
  first?: number;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link PredictionsApi.create}. */
export interface CreatePredictionParams {
  /** Broadcaster who runs the prediction. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** Question the viewers bet on, 45 characters at most. */
  title: string;
  /** Two to ten outcomes, each 25 characters at most. Plain strings work too. */
  outcomes: readonly (string | { title: string })[];
  /** How long viewers can bet, in seconds, 30 to 1800. */
  prediction_window: number;
}

/** Parameters of {@link PredictionsApi.end}. */
export interface EndPredictionParams {
  /** Broadcaster who runs the prediction. Defaults to the user making the call. */
  broadcaster_id?: string;
  /** ID of the prediction to update. */
  id: string;
  /**
   * `"LOCKED"` closes the bets, `"RESOLVED"` pays out the winners, `"CANCELED"`
   * refunds everyone. A locked prediction can still be resolved or canceled.
   */
  status: "RESOLVED" | "CANCELED" | "LOCKED";
  /** ID of the outcome that won. Required when `status` is `"RESOLVED"`. */
  winning_outcome_id?: string;
}

/** Predictions: create, read, lock and resolve them. */
export class PredictionsApi extends ApiGroup {
  /**
   * Lists the predictions of a channel, most recent first.
   *
   * Token: user, scope `channel:read:predictions` or `channel:manage:predictions`.
   *
   * @example
   * const latest = await twitch.predictions.get().first();
   * @see https://dev.twitch.tv/docs/api/reference/#get-predictions
   */
  get(params: GetPredictionsParams = {}, options?: RequestOptions): Paginator<Prediction> {
    return this.rest.paginate<Prediction>(
      {
        path: "predictions",
        query: params,
        auth: "user",
        scopes: ["channel:read:predictions", "channel:manage:predictions"],
        context: "broadcaster_id",
        options,
      },
      { max: 25 },
    );
  }

  /**
   * Starts a prediction in a channel. Bets open at once, and a channel can
   * only run one prediction at a time.
   *
   * Token: user, scope `channel:manage:predictions`.
   *
   * @example
   * const prediction = await twitch.predictions.create({
   *   title: "Will the boss go down first try?",
   *   outcomes: ["Yes", "No"],
   *   prediction_window: 120,
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#create-prediction
   */
  create(params: CreatePredictionParams, options?: RequestOptions): Promise<Prediction> {
    return this.rest.one<Prediction>({
      method: "POST",
      path: "predictions",
      body: {
        ...params,
        outcomes: params.outcomes.map((outcome) => (typeof outcome === "string" ? { title: outcome } : outcome)),
      },
      auth: "user",
      scopes: ["channel:manage:predictions"],
      context: { body: "broadcaster_id" },
      options,
    });
  }

  /**
   * Locks, resolves or cancels a prediction. One left unresolved for 24 hours
   * after its window closed is canceled by Twitch and the points are refunded.
   *
   * Token: user, scope `channel:manage:predictions`.
   *
   * @example
   * await twitch.predictions.end({ id: predictionId, status: "LOCKED" });
   * await twitch.predictions.end({ id: predictionId, status: "RESOLVED", winning_outcome_id: outcomeId });
   * @see https://dev.twitch.tv/docs/api/reference/#end-prediction
   */
  end(params: EndPredictionParams, options?: RequestOptions): Promise<Prediction> {
    return this.rest.one<Prediction>({
      method: "PATCH",
      path: "predictions",
      body: params,
      auth: "user",
      scopes: ["channel:manage:predictions"],
      context: { body: "broadcaster_id" },
      options,
    });
  }
}
