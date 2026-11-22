import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { pendingRuns } from '../../services/pendingRunDatabase';
import { createPendingWriter } from './pendingWriter';
import { t } from '../language/language.js';

/** @typedef {import('../../services/pendingRunRepository').RunCheckpoint} Checkpoint */
/** @typedef {{id: string, owner: string, writer: {set: (value: Checkpoint) => void, flush: () => Promise<void>, close: () => void}}} DraftContext */
/** @param {string | null} owner */
export function useRunDraft(owner) {
  const currentOwner = useRef(owner);
  useLayoutEffect(() => { currentOwner.current = owner; }, [owner]);
  const mounted = useRef(true);
  const context = useRef(/** @type {DraftContext | null} */ (null));
  const [state, setState] = useState('idle');
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => () => {
    const previous = context.current;
    context.current = null;
    // Existing rows may finish flushing for the original owner. UPDATE cannot
    // recreate a row removed by account clearing or a successful session save.
    if (previous) void previous.writer.flush().catch(() => {}).finally(() => previous.writer.close());
  }, [owner]);
  const prepare = useCallback(async (/** @type {{id: string, patientId: string | null, testId: string, startedAt: string, withCamera: boolean}} */ run) => {
    const account = currentOwner.current;
    if (!account) return;
    const isCurrent = () => mounted.current && currentOwner.current === account;
    await pendingRuns.begin(account, run, isCurrent);
    if (!isCurrent()) throw new Error(t('Tài khoản đã thay đổi.'));
    const writer = createPendingWriter({
      write: (/** @type {Checkpoint} */ snapshot, revision) => pendingRuns.update(account, run.id, snapshot, revision),
      onState: (value) => { if (isCurrent() && context.current?.id === run.id) setState(value); },
    });
    context.current?.writer.close();
    context.current = { id: run.id, owner: account, writer };
    setState('saved');
  }, []);
  const checkpoint = useCallback((/** @type {Checkpoint} */ value) => {
    if (context.current && context.current.owner === currentOwner.current) context.current.writer.set(value);
  }, []);
  const stop = useCallback(() => { context.current?.writer.close(); context.current = null; if (mounted.current) setState('idle'); }, []);
  const flush = useCallback(async () => { await context.current?.writer.flush(); }, []);
  const discard = useCallback(async () => {
    const previous = context.current;
    if (!previous || previous.owner !== currentOwner.current) throw new Error(t('Tài khoản đã thay đổi.'));
    await pendingRuns.remove(previous.owner, previous.id);
    if (context.current === previous) stop();
  }, [stop]);
  return { prepare, checkpoint, stop, flush, discard, state };
}
