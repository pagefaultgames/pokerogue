import { loggedInUser } from "#app/account";

/**
 * Utility function to obtain the local storage key for a given save slot.
 * @param slotId - The numerical save slot ID
 * Will throw an error if `<0` (in line with standard util functions)
 * @returns The local storage key used to access the save data for the given slot.
 */
export function getSaveDataLocalStorageKey(slotId: number): string {
  if (slotId < 0) {
    throw new Error("Cannot access a negative save slot ID from localstorage!");
  }

  return `sessionData${slotId || ""}_${loggedInUser?.username}`;
}
