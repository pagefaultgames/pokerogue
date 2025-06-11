// biome-ignore lint/correctness/noUnusedImports: Used in tsdoc
import type ConfirmUiHandler from "#app/ui/confirm-ui-handler";

/**
 * Used by {@linkcode ConfirmUiHandler} to determine whether the cursor should start on Yes or No
 */
export const ConfirmUiMode = Object.freeze({
    /** Start cursor on Yes */
    DEFAULT_YES: 1,
    /** Start cursor on No */
    DEFAULT_NO: 2
});
export type ConfirmUiMode = typeof ConfirmUiMode[keyof typeof ConfirmUiMode];