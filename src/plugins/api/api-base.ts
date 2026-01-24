import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { getCookie } from "#utils/cookies";
import type { SetRequired, UndefinedOnPartialDeep } from "type-fest";

type DataType = "json" | "form-urlencoded";

/**
 * Configuration type for {@linkcode ApiBase.doFetch}.
 * @internal
 */
interface DoFetchConfig extends SetRequired<UndefinedOnPartialDeep<RequestInit>, "method"> {}

export abstract class ApiBase {
  //#region Fields

  public readonly ERR_GENERIC: string = "There was an error";

  protected readonly base: string;

  //#region Public

  constructor(base: string) {
    this.base = base;
  }

  //#region Protected

  /**
   * Send an HTTP GET request.
   * @param path - The path to send the request to
   */
  protected async doGet(path: string) {
    return this.doFetch(path, { method: "GET" });
  }

  /**
   * Send an HTTP POST request.
   * @param path - The path to send the request to
   * @param bodyData - The body-data to send; will be stringified if needed
   * @param dataType - (Default `"json"`) The type of data to send
   */
  protected async doPost(path: string, bodyData?: Record<string, any> | string, dataType?: "json"): Promise<Response>;
  /**
   * Send an HTTP POST request.
   * @param path - The path to send the request to
   * @param bodyData - The body-data to send; will be stringified if needed
   * @param dataType - (Default `"json"`) The type of data to send
   */
  protected async doPost(path: string, bodyData: Record<string, any>, dataType: "form-urlencoded"): Promise<Response>;
  protected async doPost(path: string, bodyData?: Record<string, any>, dataType: DataType = "json"): Promise<Response> {
    if (bodyData === undefined) {
      return this.doFetch(path, { method: "POST" });
    }

    let body: string;
    const headers: HeadersInit = {};

    switch (dataType) {
      case "json":
        body = typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData);
        headers["Content-Type"] = "application/json";
        break;
      case "form-urlencoded":
        if (typeof bodyData !== "object" || Array.isArray(bodyData) || bodyData === null) {
          console.error(`Incorrect type of bodyData passed to form-urlencoded POST request!\nBodyData:${bodyData}`);
          return Promise.reject("Invalid bodyData for form-urlencoded POST request");
        }

        body = this.toUrlSearchParams(bodyData).toString();
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        break;
      default:
        console.error(`Unsupported data type: ${dataType}`);
        body = String(bodyData);
        headers["Content-Type"] = "text/plain";
        break;
    }
    return await this.doFetch(path, { method: "POST", body, headers });
  }

  /**
   * A generic request helper.
   * @param path - The path to send the request to
   * @param config - The request configuration
   */
  protected async doFetch(path: string, config: DoFetchConfig): Promise<Response> {
    config.headers = {
      ...config.headers,
      Authorization: getCookie(SESSION_ID_COOKIE_NAME),
      "Content-Type": config.headers?.["Content-Type"] ?? "application/json",
    };

    // can't import `isLocal` due to circular import issues
    if (import.meta.env.MODE === "development") {
      console.log(`Sending ${config.method} request to: `, this.base + path, config);
    }

    // TODO: need some sort of error handling here?
    return await fetch(this.base + path, config as RequestInit);
  }

  /**
   * Helper to transform data to {@linkcode URLSearchParams}
   * Any key with a value of `undefined` will be ignored.
   * Any key with a value of `null` will be included.
   * @param data the data to transform to {@linkcode URLSearchParams}
   * @returns a {@linkcode URLSearchParams} representaton of {@linkcode data}
   */
  protected toUrlSearchParams(data: Record<string, any>): URLSearchParams {
    const arr = Object.entries(data)
      .map(([key, value]) => (value !== undefined ? [key, String(value)] : [key, ""]))
      .filter(([, value]) => value !== "");

    return new URLSearchParams(arr);
  }
}
