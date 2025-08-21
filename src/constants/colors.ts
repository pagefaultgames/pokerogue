/**
 * A large `const object` holding preset colors for various logging strings.
 * @remarks
 * Please do not import this as anything but `Colors`!
 */
const Colors = {
  // Colors used in prod
  PHASE_START: "green",
  MOVE: "RebeccaPurple",

  // Colors used for testing code
  NEW_TURN: "#ffad00ff",
  UI_MSG: "#009dffff",
  OVERRIDES: "#b0b01eff",

  // Mock console log stuff
  TRACE: "#b700ff",
  DEBUG: "#874600ff",
} as const satisfies Record<string, string>;

export default Colors;
