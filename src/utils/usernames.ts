export const usernameLsKey = "usernames" as const;

/**
 * Saves the Username for the key icon on login.
 * @param username - The username to save in local storage.
 */
export function saveUsername(username: string): void {
  const data = localStorage.getItem(usernameLsKey) ?? "[]";
  const usernames = JSON.parse(data) as string[];
  if (!usernames.includes(username)) {
    usernames.push(username);
  }
  localStorage.setItem(usernameLsKey, JSON.stringify(usernames));
}

/**
 * Gets all saved usernames from local storage.
 */
export function getUsernames(): string[] {
  const data = localStorage.getItem(usernameLsKey) ?? "[]";
  return JSON.parse(data) as string[];
}
