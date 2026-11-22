/** Serialize/coalesce checkpoints. An acknowledged revision means the write finished.
 * @template T
 * @param {{write: (snapshot: T, revision: number) => Promise<boolean>, onState?: (state: 'saving' | 'saved' | 'error') => void, revision?: number}} options */
export function createPendingWriter({ write, onState = () => {}, revision = 0 }) {
  let nextRevision = revision;
  /** @type {{snapshot: T, revision: number} | null} */
  let pending = null;
  /** @type {Promise<void> | null} */
  let running = null;
  let closed = false;
  /** @type {unknown} */
  let failure = null;
  function drain() {
    if (running || closed || !pending) return;
    running = (async () => {
      while (!closed && pending) {
        const item = pending; pending = null;
        try {
          if (!await write(item.snapshot, item.revision)) throw new Error('Checkpoint no longer writable');
          failure = null;
          if (!closed && !pending) onState('saved');
        } catch (error) {
          failure = error;
          pending = closed ? null : pending || item;
          if (!closed) onState('error');
          break;
        }
      }
    })().finally(() => { running = null; if (pending && !failure && !closed) drain(); });
  }
  return {
    /** @param {T} snapshot */
    set(snapshot) {
      if (closed) return;
      pending = { snapshot, revision: ++nextRevision };
      onState('saving'); drain();
    },
    async flush() {
      while (!closed && (pending || running)) {
        if (!running) { onState('saving'); drain(); }
        const task = running;
        if (task) await task;
        if (failure) throw failure;
      }
    },
    close() { closed = true; pending = null; },
  };
}
