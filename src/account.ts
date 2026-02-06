import { pokerogueApi } from "#api/pokerogue-api";
import { BYPASS_LOGIN } from "#constants/app-constants";
import type { UserInfo } from "#types/api";
import { randomString } from "#utils/common";

export let loggedInUser: UserInfo | null = null;
// This is a random string that is used to identify the client session - unique per session (tab or window) so that the game will only save on the one that the server is expecting
export const clientSessionId = randomString(32);

export async function updateUserInfo(): Promise<[success: boolean, status: number]> {
  if (!BYPASS_LOGIN) {
    const [accountInfo, status] = await pokerogueApi.account.getInfo();
    if (!accountInfo) {
      return [false, status];
    }
    loggedInUser = accountInfo;
    return [true, 200];
  }

  loggedInUser = {
    username: "Guest",
    lastSessionSlot: -1,
    discordId: "",
    googleId: "",
    hasAdminRole: false,
  };
  let lastSessionSlot = -1;
  for (let s = 0; s < 5; s++) {
    if (localStorage.getItem(`sessionData${s || ""}_${loggedInUser.username}`)) {
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
