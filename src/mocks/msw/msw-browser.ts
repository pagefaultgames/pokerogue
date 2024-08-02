import { setupWorker } from "msw/browser";
import { getHandlers } from "./handlers/get-handlers";
import { postHandlers } from "./handlers/post-handlers";

export const worker = setupWorker(...getHandlers, ...postHandlers);
