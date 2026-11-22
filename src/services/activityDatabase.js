import { getDatabase } from './patientDatabase';
import { createActivityRepository } from './activityRepository';
export const activityDatabase = createActivityRepository(getDatabase);
