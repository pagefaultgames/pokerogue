import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
  discordId: string;
  googleId: string;
  hasAdminRole: boolean;
}

export let loggedInUser: UserInfo | null = null;
// This is a random string that is used to identify the client session - unique per session (tab or window) so that the game will only save on the one that the server is expecting
export const clientSessionId = Utils.randomString(32);

export function initLoggedInUser(): void {
  loggedInUser = { username: "Guest", lastSessionSlot: -1, discordId: "", googleId: "", hasAdminRole: false };
}

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (bypassLogin) {
      loggedInUser = { username: "Guest", lastSessionSlot: -1, discordId: "", googleId: "", hasAdminRole: false};
      let lastSessionSlot = -1;
      for (let s = 0; s < 5; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ""}_${loggedInUser.username}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser.lastSessionSlot = lastSessionSlot;
      // Migrate old data from before the username was appended
      [ "data", "sessionData", "sessionData1", "sessionData2", "sessionData3", "sessionData4" ].map(d => {
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
      return resolve([ true, 200 ]);
    }
    Utils.apiFetch("account/info", true).then(response => {
      if (!response.ok) {
        resolve([ false, response.status ]);
        return;
      }
      return response.json();
    }).then(jsonResponse => {
      loggedInUser = jsonResponse;
      resolve([ true, 200 ]);
    }).catch(err => {
      console.error(err);
      resolve([ false, 500 ]);
    });
  });
}
