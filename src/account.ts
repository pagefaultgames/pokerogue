import { LoginBypass } from "./battle-scene";
import * as Utils from "./utils";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
}

export let loggedInUser: UserInfo = null;
export const clientSessionId = Utils.randomString(32);

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (LoginBypass.bypassLogin) {
      loggedInUser = { username: "Guest", lastSessionSlot: -1 };
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
        if (localStorage.hasOwnProperty(d)) {
          if (localStorage.hasOwnProperty(`${d}_${loggedInUser.username}`)) {
            localStorage.setItem(`${d}_${loggedInUser.username}_bak`, localStorage.getItem(`${d}_${loggedInUser.username}`));
          }
          localStorage.setItem(`${d}_${loggedInUser.username}`, localStorage.getItem(d));
          localStorage.removeItem(d);
        }
      });
      return resolve([ true, 200 ]);
    }
    Utils.apiFetch("account/info", true).then(response => {
      if (!response.ok) {
        for(const key in localStorage) {
          if (key.startsWith("data_")) {
            loggedInUser = { username: key.substring(5), lastSessionSlot: -1};
            LoginBypass.bypassLogin = true;
            LoginBypass.startInterval();
            return loggedInUser;
          }
        }
        resolve([ false, 500]);
      }
      return response.json();
    }).then(jsonResponse => {
      loggedInUser = jsonResponse;
      resolve([ true, 200 ]);
    }).catch(err => {
      console.log("error");
      console.log(err);
      resolve([ false, 500 ]);
    });
  });
}

export function ping() : Promise<boolean> {
  return new Promise<boolean>(resolve => {
    Utils.apiFetch("account/info", true).then(response => {
      console.log("ping");
      if (!response.ok) {
        resolve(false);
      }
      resolve(true);
    }).catch(err => {
      console.error(err);
      resolve(false);
    });
  });
}
