// Client-side auth utilities
// Provides compatibility layer for task-approval-flow branch imports

import { getOptionalSession } from "./session";

/**
 * Get the current session
 * Legacy compatibility export from task-approval-flow branch
 * Use getOptionalSession or requireSession for new code
 */
export { getOptionalSession as getSession } from "./session";
