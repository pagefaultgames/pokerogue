import { pokerogueApi } from "#api/pokerogue-api";
import { bypassLogin } from "#app/global-vars/bypass-login";
import type { UserInfo } from "#types/user-info";
import { randomString } from "#utils/common";

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

export async function updateUserInfo(): Promise<[boolean, number]> {
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
    ["data", "sessionData", "sessionData1", "sessionData2", "sessionData3", "sessionData4"].forEach(d => {
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
    return [true, 200];
  }

  const [accountInfo, status] = await pokerogueApi.account.getInfo();
  if (!accountInfo) {
    return [false, status];
  }
  loggedInUser = accountInfo;
  return [true, 200];
}
