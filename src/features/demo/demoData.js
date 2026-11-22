export const DEMO_PATIENTS = Object.freeze([
  Object.freeze({ id: 'demo-an', name: 'Nguyễn An (mẫu)', code: 'DEMO-01', gender: 'Nam' }),
  Object.freeze({ id: 'demo-binh', name: 'Trần Bình (mẫu)', code: 'DEMO-02', gender: 'Nữ' }),
]);

/** @param {{demo: boolean, signedIn: boolean, userId: string | undefined}} mode */
export function runCapabilities({ demo, signedIn, userId }) {
  return { ownerId: !demo && signedIn ? userId : undefined, cameraAllowed: !demo };
}

/** @typedef {{id: string, patientName: string, testId: string, status: string, elapsedMs: number, notes: string}} DemoSession */
/** @param {DemoSession[]} previous @param {DemoSession} session */
export function appendDemoSession(previous, session) {
  return [{ ...session, notes: session.notes.trim().slice(0, 1000) }, ...previous.filter((item) => item.id !== session.id)].slice(0, 10);
}
