import type { Paginator } from "../http/pagination.js";
import type { RequestOptions } from "../http/rest.js";
import { ApiGroup } from "./base.js";

/** A conduit: a named bundle of shards that EventSub spreads notifications over. */
export interface Conduit {
  /** ID of the conduit. */
  id: string;
  /** Number of shards the conduit has. */
  shard_count: number;
}

/** State of a conduit shard. Only `enabled` shards receive events. */
export type ConduitShardStatus =
  | "enabled"
  | "webhook_callback_verification_pending"
  | "webhook_callback_verification_failed"
  | "notification_failures_exceeded"
  | "websocket_disconnected"
  | "websocket_failed_ping_pong"
  | "websocket_received_inbound_traffic"
  | "websocket_internal_error"
  | "websocket_network_timeout"
  | "websocket_network_error"
  | "websocket_failed_to_reconnect";

/** Transport of a shard, as Twitch reports it. */
export interface ConduitShardTransport {
  /** How the shard receives events. */
  method: "webhook" | "websocket";
  /** Callback URL. Webhook shards only. */
  callback?: string;
  /** WebSocket session ID. WebSocket shards only. */
  session_id?: string;
  /** When the WebSocket connected, as an RFC 3339 timestamp. WebSocket shards only. */
  connected_at?: string;
  /** When the WebSocket disconnected, as an RFC 3339 timestamp. WebSocket shards only. */
  disconnected_at?: string;
}

/** One shard of a conduit. */
export interface ConduitShard {
  /** ID of the shard: its index, starting at `"0"`. */
  id: string;
  /** Current state of the shard. */
  status: ConduitShardStatus;
  /** Where the shard delivers events. */
  transport: ConduitShardTransport;
}

/** Transport to assign to a shard. */
export type ConduitShardTransportInput =
  | {
      /** Deliver the events of the shard to a webhook. */
      method: "webhook";
      /** Public HTTPS URL, on port 443, that receives the notifications. */
      callback: string;
      /** Secret used to sign notifications: 10 to 100 ASCII characters. */
      secret: string;
    }
  | {
      /** Deliver the events of the shard to a WebSocket session. */
      method: "websocket";
      /** ID of the WebSocket session, from its welcome message. */
      session_id: string;
    };

/** Parameters of {@link ConduitsApi.create}. */
export interface CreateConduitParams {
  /** Number of shards to create. */
  shard_count: number;
}

/** Parameters of {@link ConduitsApi.update}. */
export interface UpdateConduitParams {
  /** ID of the conduit. */
  id: string;
  /** New number of shards. Lowering it removes the shards with the highest IDs. */
  shard_count: number;
}

/** Parameters of {@link ConduitsApi.shards}. */
export interface GetConduitShardsParams {
  /** ID of the conduit. */
  conduit_id: string;
  /** Only shards in this state. */
  status?: ConduitShardStatus;
  /** Cursor of the next page. */
  after?: string;
}

/** Parameters of {@link ConduitsApi.updateShards}. */
export interface UpdateConduitShardsParams {
  /** ID of the conduit. */
  conduit_id: string;
  /** Shards to update. Any number: long lists are split for you. */
  shards: readonly {
    /** ID of the shard: its index, starting at `"0"`. */
    id: string;
    /** Transport to assign to the shard. */
    transport: ConduitShardTransportInput;
  }[];
}

/** A shard Twitch refused to update. */
export interface ConduitShardError {
  /** ID of the shard. */
  id: string;
  /** Why the update failed. */
  message: string;
  /** Machine readable error code. */
  code: string;
}

/** Result of {@link ConduitsApi.updateShards}. */
export interface UpdateConduitShardsResult {
  /** Shards that were updated. */
  data: ConduitShard[];
  /** Shards that could not be updated. */
  errors: ConduitShardError[];
}

/** Conduits: the EventSub transport that spreads events over several shards. */
export class ConduitsApi extends ApiGroup {
  /**
   * Lists the conduits of your application.
   *
   * Token: app.
   *
   * @example
   * const conduits = await twitch.conduits.list();
   * @see https://dev.twitch.tv/docs/api/reference/#get-conduits
   */
  list(options?: RequestOptions): Promise<Conduit[]> {
    return this.rest.data<Conduit>({ path: "eventsub/conduits", auth: "app", options });
  }

  /**
   * Creates a conduit with the given number of shards.
   *
   * Token: app.
   *
   * @example
   * const conduit = await twitch.conduits.create({ shard_count: 2 });
   * @see https://dev.twitch.tv/docs/api/reference/#create-conduits
   */
  create(params: CreateConduitParams, options?: RequestOptions): Promise<Conduit> {
    return this.rest.one<Conduit>({ method: "POST", path: "eventsub/conduits", body: params, auth: "app", options });
  }

  /**
   * Changes the number of shards of a conduit.
   *
   * Token: app.
   *
   * @example
   * await twitch.conduits.update({ id: conduit.id, shard_count: 5 });
   * @see https://dev.twitch.tv/docs/api/reference/#update-conduits
   */
  update(params: UpdateConduitParams, options?: RequestOptions): Promise<Conduit> {
    return this.rest.one<Conduit>({ method: "PATCH", path: "eventsub/conduits", body: params, auth: "app", options });
  }

  /**
   * Deletes a conduit. Its subscriptions stop shortly after.
   *
   * Token: app.
   *
   * @example
   * await twitch.conduits.delete(conduit.id);
   * @see https://dev.twitch.tv/docs/api/reference/#delete-conduit
   */
  delete(id: string, options?: RequestOptions): Promise<void> {
    return this.rest.send({ method: "DELETE", path: "eventsub/conduits", query: { id }, auth: "app", options });
  }

  /**
   * Lists the shards of a conduit and where each one delivers events.
   *
   * Token: app.
   *
   * @example
   * const shards = await twitch.conduits.shards({ conduit_id: conduit.id }).all();
   * @see https://dev.twitch.tv/docs/api/reference/#get-conduit-shards
   */
  shards(params: GetConduitShardsParams, options?: RequestOptions): Paginator<ConduitShard> {
    return this.rest.paginate<ConduitShard>(
      { path: "eventsub/conduits/shards", query: params, auth: "app", options },
      // The endpoint has no page size parameter.
      { sizeParam: null },
    );
  }

  /**
   * Points shards at a webhook callback or a WebSocket session. Shards that
   * could not be updated are reported in `errors` instead of throwing.
   *
   * Token: app.
   *
   * @example
   * const { errors } = await twitch.conduits.updateShards({
   *   conduit_id: conduit.id,
   *   shards: [{ id: "0", transport: { method: "websocket", session_id } }],
   * });
   * @see https://dev.twitch.tv/docs/api/reference/#update-conduit-shards
   */
  async updateShards(params: UpdateConduitShardsParams, options?: RequestOptions): Promise<UpdateConduitShardsResult> {
    const result: UpdateConduitShardsResult = { data: [], errors: [] };
    for (let start = 0; start < params.shards.length; start += 100) {
      const body = await this.rest.request<Partial<UpdateConduitShardsResult> | undefined>({
        method: "PATCH",
        path: "eventsub/conduits/shards",
        body: { conduit_id: params.conduit_id, shards: params.shards.slice(start, start + 100) },
        auth: "app",
        options,
      });
      result.data.push(...(body?.data ?? []));
      result.errors.push(...(body?.errors ?? []));
    }
    return result;
  }
}
