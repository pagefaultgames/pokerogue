import { bypassLogin } from "./battle-scene";
import * as Utils from "./utils";

export let loggedInUser = null;

export function updateUserInfo(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    if (bypassLogin) {
      loggedInUser = { username: 'Guest' };
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