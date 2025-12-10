/**
 * Obtain the value of a property value CLI argument (one of the form
 * `-x=y` or `-x y`).
 * @param {string[]} args - The command line arguments array to parse
 * @param {readonly string[]} flags - An array containing all valid flags to check.
 * @returns {string | undefined} The provided arguments, or `undefined` if none is provided
 * @remarks
 * This will mutate the `args` array by removing the first specified match.
 */
export function getPropertyValue(args, flags) {
  let /** @type {string | undefined} */ arg;
  // Extract the prop as either the form "-o=y" or "-o y".
  const hasEquals = /^.*=(.+)$/g.exec(args[0]);
  if (hasEquals) {
    arg = hasEquals[1];
    args.splice(0, 1);
  } else if (flags.includes(args[0])) {
    arg = args[1];
    args.splice(0, 2);
  }

  return arg;
}
