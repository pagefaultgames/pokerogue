import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
}

export let loggedInUser: UserInfo = null;
export const clientSessionId = Utils.randomString(32);

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (bypassLogin) {
      loggedInUser = { username: 'Guest', lastSessionSlot: -1 };
      let lastSessionSlot = -1;
      for (let s = 0; s < 2; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ''}_${loggedInUser.username}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser.lastSessionSlot = lastSessionSlot;
      return resolve([ true, 200 ]);
    }
    Utils.apiFetch('account/info', true).then(response => {
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