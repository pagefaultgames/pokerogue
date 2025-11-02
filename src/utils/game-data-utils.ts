import { loggedInUser } from "#app/account";

/**
 * Obtain the local storage key corresponding to a given save slot.
 * @param slotId - The numerical save slot ID
 * @throws {Error}
 * Throws if `slotId < 0` (which likely indicates an invalid slot passed from the title screen)
 * @returns The local storage key used to access the save data for the given slot.
 */
export function getSaveDataLocalStorageKey(slotId: number): string {
  if (slotId < 0) {
    throw new Error("Cannot access a negative save slot ID from localstorage!");
  }

  // TODO: Default to `Guest` as a fallback for no logged in username
  // rather than leaving a trailing underscore
  return `sessionData${slotId || ""}_${loggedInUser?.username}`;
}
