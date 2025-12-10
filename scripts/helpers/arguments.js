/**
 * Obtain the value of a property value CLI argument (one of the form
 * `-x=y` or `-x y`).
 * @param {string[]} args - The command line arguments array to parse
 * @param {readonly string[]} aliases - An array containing all valid properties to check.
 * @returns {string | undefined} The outfile location, or `undefined` if none is provided
 * @remarks
 * This will mutate the `args` array by removing the first specified match.
 */
export function getPropertyValue(args, aliases) {
  let /** @type {string | undefined} */ outFile;
  // Extract the outfile as either the form "-o=y" or "-o y".
  const hasEquals = /^.*=(.+)$/g.exec(args[0]);
  if (hasEquals) {
    outFile = hasEquals[1];
    args.splice(0, 1);
  } else if (aliases.includes(args[0])) {
    outFile = args[1];
    args.splice(0, 2);
  }

  return outFile;
}
