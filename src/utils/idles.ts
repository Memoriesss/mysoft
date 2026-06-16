import { useEffect, useRef } from "react";

/**
 * 沉默 N 秒后触发回调；如果期间被 reset() / kick() 唤醒则重置。
 * 用法：const { kick, reset } = useIdle(8000, onIdle);
 */
export function useIdle(idleMs: number, onIdle: () => void) {
  const timerRef = useRef<number | null>(null);
  const cbRef = useRef(onIdle);
  cbRef.current = onIdle;

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const arm = () => {
    clear();
    timerRef.current = window.setTimeout(() => {
      cbRef.current();
    }, idleMs);
  };

  useEffect(() => {
    arm();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMs]);

  return {
    kick: arm,
    reset: arm,
    cancel: clear,
  };
}
