import { getDatabase } from './patientDatabase';
import { createSessionRepository } from './sessionRepository';
export const sessionDatabase = createSessionRepository(getDatabase);
