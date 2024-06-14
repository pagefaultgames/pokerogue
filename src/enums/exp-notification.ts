/**
 * Determines exp notification style.
 * - Default - the normal exp gain display, nothing changed
 * - Only level up - we display the level up in the small frame instead of a message
 * - Skip - no level up frame nor message
*/
export enum ExpNotification {
    DEFAULT,
    ONLY_LEVEL_UP,
    SKIP
}
