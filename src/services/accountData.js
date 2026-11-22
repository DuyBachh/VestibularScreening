import { getDatabase } from './patientDatabase';
import { createAccountDataRepository } from './accountDataRepository';
export const accountData = createAccountDataRepository(getDatabase);
