import { getDatabase } from './patientDatabase';
import { createBrandingRepository } from './brandingRepository';
export const brandingDatabase = createBrandingRepository(getDatabase);
