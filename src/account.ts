import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
}

export let loggedInUser: UserInfo = null;

export function updateUserInfo(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (bypassLogin) {
      let lastSessionSlot = -1;
      for (let s = 0; s < 2; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ''}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser = { username: 'Guest', lastSessionSlot: lastSessionSlot };
      return resolve(true);
    }
    Utils.apiFetch('account/info').then(response => {
      if (!response.ok) {
        loggedInUser = null;
        resolve(false);
        return;
      }
      return response.json();
    }).then(jsonResponse => {
      loggedInUser = jsonResponse;
      resolve(true);
    });
  });
}