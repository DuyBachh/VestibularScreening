import { getDatabase } from './patientDatabase';
import { createPendingRunRepository } from './pendingRunRepository';
export const pendingRuns = createPendingRunRepository(getDatabase);
