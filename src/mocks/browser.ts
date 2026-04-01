import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { chatHandlers } from "./handlers/chat";
import { documentHandlers } from "./handlers/documents";
import { settingsHandlers } from "./handlers/settings";

export const worker = setupWorker(
  ...authHandlers,
  ...chatHandlers,
  ...documentHandlers,
  ...settingsHandlers,
);
