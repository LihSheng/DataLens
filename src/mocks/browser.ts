import { setupWorker } from "msw/browser";
import { authHandlers } from "./handlers/auth";
import { chatHandlers } from "./handlers/chat";
import { documentHandlers } from "./handlers/documents";
import { settingsHandlers } from "./handlers/settings";
import { observabilityHandlers } from "./handlers/observability";
import { userHandlers } from "./handlers/users";
import { feedbackHandlers } from "./handlers/feedback";
import { conversationHandlers } from "./handlers/conversations";

export const worker = setupWorker(
  ...authHandlers,
  ...chatHandlers,
  ...documentHandlers,
  ...settingsHandlers,
  ...observabilityHandlers,
  ...userHandlers,
  ...feedbackHandlers,
  ...conversationHandlers,
);
