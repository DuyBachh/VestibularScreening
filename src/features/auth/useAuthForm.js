import { useRef, useState } from 'react';
import { authErrorMessage } from './validation';

export function useAuthForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inFlight = useRef(false);
  /** @param {() => Promise<void>} action */
  async function run(action) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch (failure) { setError(authErrorMessage(failure)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return { busy, error, message, setError, setMessage, run };
}
