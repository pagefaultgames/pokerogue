import { pokerogueApi } from "#api/pokerogue-api";
import { bypassLogin } from "#constants/app-constants";
import type { UserInfo } from "#types/api";
import { randomString } from "#utils/common";

export let loggedInUser: UserInfo | null = null;

/** A random, 32-length alphanumeric string used to identify the current client session. */
// TODO: This should arguably be inside its own file
export const clientSessionId = randomString(32);

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
  for (let s = 0; s < 5; s++) {
    if (localStorage.getItem(getSessionDataLocalStorageKey(s))) {
      loggedInUser.lastSessionSlot = s;
      break;
    }
  }

  // Migrate old data from before the username was appended
  // TODO: This fallback has existed for 20 MONTHS by now; review if we need it anymore
  for (const d of ["data", "sessionData", "sessionData1", "sessionData2", "sessionData3", "sessionData4"]) {
    const lsItem = localStorage.getItem(d);
    if (lsItem) {
      const lsUserItem = localStorage.getItem(`${d}_${loggedInUser.username}`);
      if (lsUserItem) {
        localStorage.setItem(`${d}_${loggedInUser.username}_bak`, lsUserItem);
      }
      localStorage.setItem(`${d}_${loggedInUser.username}`, lsItem);
      localStorage.removeItem(d);
    }
  }
  return [true, 200];
}

/**
 * Obtain the local storage key corresponding to a given save slot.
 * @param slotId - The numerical save slot ID
 * @throws {Error}
 * Throws if `slotId < 0` (which likely indicates an invalid slot passed from the title screen)
 * @returns The local storage key used to access the save data for the given slot.
 */
export function getSessionDataLocalStorageKey(slotId: number): string {
  if (slotId < 0) {
    throw new Error("Cannot access a negative save slot ID from localstorage!");
  }

  // TODO: Default to `Guest` as a fallback for no logged in username
  // rather than leaving a trailing underscore
  return `sessionData${slotId || ""}_${loggedInUser?.username}`;
}
