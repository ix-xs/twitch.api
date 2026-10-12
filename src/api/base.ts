import type { Rest } from "../http/rest.js";

/** Base of every API group. Holds the request pipeline the methods go through. */
export abstract class ApiGroup {
  /** @internal */
  protected readonly rest: Rest;

  /** @internal */
  constructor(rest: Rest) {
    this.rest = rest;
  }
}
