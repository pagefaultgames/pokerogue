import {LoginBypass} from "./battle-scene";
import * as Utils from "./utils";
import disasterRecoveryInstance from "#app/disasterRecover";

export interface UserInfo {
  username: string;
  lastSessionSlot: integer;
}

export let loggedInUser: UserInfo = null;
export const clientSessionId = Utils.randomString(32);

export function setLoggedInUser(username: string, lastSessionSlot: integer): void {
  loggedInUser = { username, lastSessionSlot };
}

export function updateUserInfo(): Promise<[boolean, integer]> {
  return new Promise<[boolean, integer]>(resolve => {
    if (LoginBypass.bypassLogin && !LoginBypass.isDisasterMode) {
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
    const handleServerUnreachable = () => {
      for (const key in localStorage) {
        if (key.startsWith("data_") && !key.toLowerCase().includes("guest")) {
          let lastSession;
          for (let s = 0; s < 5; s++) {
            if (localStorage.getItem(`sessionData${s ? s : ""}_${key.substring(5)}`)) {
              lastSession = s;
              break;
            }
          }
          loggedInUser = { username: key.substring(5), lastSessionSlot: lastSession};
          disasterRecoveryInstance.startInterval();
          return loggedInUser;
        }
      }
    };
    Utils.apiFetch("account/info", true).then(response => {
      if (!response.ok) {
        const loggedInUser = handleServerUnreachable();
        if (!loggedInUser) {
          resolve([ false, 500]);
        }
        resolve([ true, 200]);
      }
      return response.json();
    }).then(jsonResponse => {
      loggedInUser = jsonResponse;
      resolve([ true, 200 ]);
    }).catch(err => {
      handleServerUnreachable();
      resolve([ false, 500 ]);
    });
  });
}

export function ping() : Promise<boolean> {
  return new Promise<boolean>(resolve => {
    Utils.apiFetch("account/info", true).then(response => {
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
