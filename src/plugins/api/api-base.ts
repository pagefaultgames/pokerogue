import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { getCookie } from "#utils/cookies";

type DataType = "json" | "form-urlencoded";

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
   * Send a GET request.
   * @param path The path to send the request to.
   */
  protected async doGet(path: string) {
    return this.doFetch(path, { method: "GET" });
  }

  /**
   * Send a POST request.
   * @param path THe path to send the request to.
   * @param bodyData The body-data to send.
   * @param dataType The data-type of the {@linkcode bodyData}.
   */
  protected async doPost<D = undefined>(path: string, bodyData?: D, dataType: DataType = "json") {
    let body: string | undefined;
    const headers: HeadersInit = {};

    if (bodyData) {
      if (dataType === "json") {
        body = typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData);
        headers["Content-Type"] = "application/json";
      } else if (dataType === "form-urlencoded") {
        if (bodyData instanceof Object) {
          body = this.toUrlSearchParams(bodyData).toString();
        } else {
          console.warn("Could not add body data to form-urlencoded!", bodyData);
        }
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        console.warn(`Unsupported data type: ${dataType}`);
        body = String(bodyData);
        headers["Content-Type"] = "text/plain";
      }
    }

    return await this.doFetch(path, { method: "POST", body, headers });
  }

  /**
   * A generic request helper.
   * @param path The path to send the request to.
   * @param config The request {@linkcode RequestInit | Configuration}.
   */
  protected async doFetch(path: string, config: RequestInit): Promise<Response> {
    config.headers = {
      ...config.headers,
      Authorization: getCookie(SESSION_ID_COOKIE_NAME),
      "Content-Type": config.headers?.["Content-Type"] ?? "application/json",
    };

    if (import.meta.env.DEV) {
      console.log(`Sending ${config.method ?? "GET"} request to: `, this.base + path, config);
    }

    return await fetch(this.base + path, config);
  }

  /**
   * Helper to transform data to {@linkcode URLSearchParams}
   * Any key with a value of `undefined` will be ignored.
   * Any key with a value of `null` will be included.
   * @param data the data to transform to {@linkcode URLSearchParams}
   * @returns a {@linkcode URLSearchParams} representaton of {@linkcode data}
   */
  protected toUrlSearchParams<D extends Record<string, any>>(data: D) {
    const arr = Object.entries(data)
      .map(([key, value]) => (value !== undefined ? [key, String(value)] : [key, ""]))
      .filter(([, value]) => value !== "");

    return new URLSearchParams(arr);
  }
}
