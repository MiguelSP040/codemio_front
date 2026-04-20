import { useEffect, useRef } from 'react';
import { analysisPollLog } from '../utils/analysisInstrumentation';

function perfNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function useAnalysisRunsPoll({ active, poll, source = 'unknown' }) {
  const pollRef = useRef(poll);
  pollRef.current = poll;
  const timeoutRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    function clearTimer() {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function schedule(ms) {
      clearTimer();
      const delay = Number.isFinite(ms) && ms > 0 ? ms : 4000;
      timeoutRef.current = window.setTimeout(() => {
        void runTick();
      }, delay);
    }

    async function runTick() {
      if (cancelled || !activeRef.current) return;
      const tickStart = perfNow();
      analysisPollLog('tick:start', { source, hidden: document.hidden });
      if (document.hidden) {
        analysisPollLog('tick:hidden_skip', { source, hidden: true, durationMs: Math.round(perfNow() - tickStart) });
        return;
      }
      let nextMs = 4000;
      try {
        nextMs = await pollRef.current();
        const durationMs = Math.round(perfNow() - tickStart);
        analysisPollLog('tick:success', {
          source,
          hidden: document.hidden,
          durationMs,
          nextMs,
        });
      } catch (err) {
        const durationMs = Math.round(perfNow() - tickStart);
        const status = err?.response?.status;
        const data = err?.response?.data;
        const message =
          (typeof data?.detail === 'string' && data.detail) ||
          (typeof data?.message === 'string' && data.message) ||
          String(err?.message || err).slice(0, 200);
        if (typeof status === 'number' && status >= 500 && status < 600) {
          nextMs = Math.min(60000, 8000 * 2);
        } else if (status === 429) {
          nextMs = Math.min(60000, 12000);
        } else if (!err?.response && (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED')) {
          nextMs = Math.min(60000, 10000);
        } else {
          nextMs = 8000;
        }
        analysisPollLog('tick:error', {
          source,
          hidden: document.hidden,
          durationMs,
          code: status ?? err?.code ?? '',
          message,
        });
        if (nextMs > 5000) {
          analysisPollLog('tick:backoff', { source, nextMs, reason: 'error_path' });
        }
      }
      if (cancelled || !activeRef.current) return;
      schedule(nextMs);
    }

    function onVisible() {
      if (!document.hidden && activeRef.current && !cancelled) {
        clearTimer();
        void runTick();
      }
    }

    document.addEventListener('visibilitychange', onVisible);
    void runTick();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      clearTimer();
    };
  }, [active]);
}
