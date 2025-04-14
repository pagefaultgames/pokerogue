import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import type { UserInfo } from "#app/@types/UserInfo";
import { bypassLogin } from "./global-vars/bypass-login";
import { randomString } from "#app/utils/common";

export let loggedInUser: UserInfo | null = null;
// This is a random string that is used to identify the client session - unique per session (tab or window) so that the game will only save on the one that the server is expecting
export const clientSessionId = randomString(32);

export function initLoggedInUser(): void {
  loggedInUser = {
    username: "Guest",
    lastSessionSlot: -1,
    discordId: "",
    googleId: "",
    hasAdminRole: false,
  };
}

export function updateUserInfo(): Promise<[boolean, number]> {
  return new Promise<[boolean, number]>(resolve => {
    if (bypassLogin) {
      loggedInUser = {
        username: "Guest",
        lastSessionSlot: -1,
        discordId: "",
        googleId: "",
        hasAdminRole: false,
      };
      let lastSessionSlot = -1;
      for (let s = 0; s < 5; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ""}_${loggedInUser.username}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser.lastSessionSlot = lastSessionSlot;
      // Migrate old data from before the username was appended
      ["data", "sessionData", "sessionData1", "sessionData2", "sessionData3", "sessionData4"].map(d => {
        const lsItem = localStorage.getItem(d);
        if (lsItem && !!loggedInUser?.username) {
          const lsUserItem = localStorage.getItem(`${d}_${loggedInUser.username}`);
          if (lsUserItem) {
            localStorage.setItem(`${d}_${loggedInUser.username}_bak`, lsUserItem);
          }
          localStorage.setItem(`${d}_${loggedInUser.username}`, lsItem);
          localStorage.removeItem(d);
        }
      });
      return resolve([true, 200]);
    }
    pokerogueApi.account.getInfo().then(([accountInfo, status]) => {
      if (!accountInfo) {
        resolve([false, status]);
        return;
      }
      loggedInUser = accountInfo;
      resolve([true, 200]);
    });
  });
}
