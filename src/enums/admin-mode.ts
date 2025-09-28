export const AdminMode = Object.freeze({
  LINK: 0,
  SEARCH: 1,
  ADMIN: 2,
});

export type AdminMode = (typeof AdminMode)[keyof typeof AdminMode];

/**
 * Get the name of the admin mode.
 * @param adminMode - The admin mode.
 * @returns The Uppercase name of the admin mode.
 */
export function getAdminModeName(adminMode: AdminMode): string {
  switch (adminMode) {
    case AdminMode.LINK:
      return "Link";
    case AdminMode.SEARCH:
      return "Search";
    default:
      return "";
  }
}
