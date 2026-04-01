import { setupServer } from "msw/node";
import { authHandlers } from "./handlers/auth";
import { chatHandlers } from "./handlers/chat";
import { documentHandlers } from "./handlers/documents";
import { settingsHandlers } from "./handlers/settings";

export const server = setupServer(
  ...authHandlers,
  ...chatHandlers,
  ...documentHandlers,
  ...settingsHandlers,
);

// Export handlers individually for targeted use in tests
export { authHandlers, chatHandlers, documentHandlers, settingsHandlers };
