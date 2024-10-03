import type { SetupServerApi } from "msw/node";

export {};

declare global {
  /**
   * Only used in testing.
   * Can technically be undefined/null but for ease of use we are going to assume it is always defined.
   * Used to looad i18n files exclusively.
   * 
   * To set up your own server in a test see `game_data.test.ts`
   */
  var i18nServer: SetupServerApi;
}
