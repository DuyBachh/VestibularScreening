import { getDatabase } from './patientDatabase';
import { createBatteryRepository } from './batteryRepository';
export const batteryDatabase = createBatteryRepository(getDatabase);
