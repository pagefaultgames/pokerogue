import { pokerogueApi } from "#api/pokerogue-api";
import { bypassLogin } from "#constants/app-constants";
import type { UserInfo } from "#types/api";
import { randomString } from "#utils/common";

export let loggedInUser: UserInfo | null = null;
// This is a random string that is used to identify the client session - unique per session (tab or window) so that the game will only save on the one that the server is expecting
export const clientSessionId = randomString(32);

/**
 * When true, the player is using the "Play as Guest" flow: a runtime-only mode that
 * skips all server sync operations and stores saves in localStorage.
 * Used when the site is deployed somewhere the PokéRogue API is unreachable (e.g. GitHub Pages, where CORS blocks it).
 * Unlike `bypassLogin` (a build-time flag), this can be flipped on per-session without changing encryption.
 */
export let isGuestMode = false;

/**
 * Activate guest mode: mark the session as offline and seed `loggedInUser` with a "Guest" account
 * so localStorage keys (`data_${username}`, `sessionData_${username}`) resolve correctly.
 * Also probes localStorage for any existing guest save to set `lastSessionSlot`.
 */
export function enableGuestMode(): void {
  isGuestMode = true;
  loggedInUser = {
    username: "Guest",
    lastSessionSlot: -1,
    discordId: "",
    googleId: "",
    hasAdminRole: false,
  };
  for (let s = 0; s < 5; s++) {
    if (localStorage.getItem(`sessionData${s || ""}_${loggedInUser.username}`)) {
      loggedInUser.lastSessionSlot = s;
      break;
    }
  }
}

export async function updateUserInfo(): Promise<[success: boolean, status: number]> {
  if (!bypassLogin) {
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
