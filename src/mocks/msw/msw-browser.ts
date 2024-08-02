import { setupWorker } from "msw/browser";
import { mswAccountHandlers } from "./api/handlers/msw-account-handlers";
import { mswDailyHandlers } from "./api/handlers/msw-daily-handlers";
import { mswGameHandlers } from "./api/handlers/msw-game-handlers";
import { mswSavedataHandlers } from "./api/handlers/msw-savedata-handlers";

const mswApiBase = import.meta.env.VITE_SERVER_URL ?? "http://localhost:8001";

export const worker = setupWorker(
  ...mswAccountHandlers(mswApiBase),
  ...mswDailyHandlers(mswApiBase),
  ...mswSavedataHandlers(mswApiBase),
  ...mswGameHandlers(mswApiBase)
);
