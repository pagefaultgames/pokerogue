import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
}

export let loggedInUser: UserInfo = null;

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (bypassLogin) {
      let lastSessionSlot = -1;
      for (let s = 0; s < 2; s++) {
        if (localStorage.getItem(`sessionData${s ? s : ''}`)) {
          lastSessionSlot = s;
          break;
        }
      }
      loggedInUser = { username: 'Guest', lastSessionSlot: lastSessionSlot };
      return resolve([ true, 200 ]);
    }
    Utils.apiFetch('account/info').then(response => {
      console.log(response.status);
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