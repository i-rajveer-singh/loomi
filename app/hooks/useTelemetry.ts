import { useCallback, useRef } from "react";

type TelemetryMetrics = {
  timeToSend: number;
  charsPerSecond: number;
  interkeypressLatency: number;
};

export function useTelemetry() {
  const firstKeyTimeRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const interKeySumRef = useRef(0);
  const interKeyCountRef = useRef(0);
  const charCountRef = useRef(0);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();
      if (firstKeyTimeRef.current === null) firstKeyTimeRef.current = now;

      if (lastKeyTimeRef.current !== null) {
        interKeySumRef.current += now - lastKeyTimeRef.current;
        interKeyCountRef.current += 1;
      }

      lastKeyTimeRef.current = now;

      const isTextKey = e.key.length === 1;
      if (isTextKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
        charCountRef.current += 1;
      }
    },
    []
  );

  const reset = useCallback(() => {
    firstKeyTimeRef.current = null;
    lastKeyTimeRef.current = null;
    interKeySumRef.current = 0;
    interKeyCountRef.current = 0;
    charCountRef.current = 0;
  }, []);

  const getAndResetTelemetry = useCallback((): TelemetryMetrics => {
    const endTime = Date.now();
    const startTime = firstKeyTimeRef.current;
    const elapsedMs = startTime === null ? 0 : Math.max(0, endTime - startTime);
    const timeToSend = elapsedMs / 1000;

    const charsPerSecond = timeToSend > 0 ? charCountRef.current / timeToSend : 0;
    const interkeypressLatency =
      interKeyCountRef.current > 0
        ? interKeySumRef.current / interKeyCountRef.current
        : 0;

    reset();

    return { timeToSend, charsPerSecond, interkeypressLatency };
  }, [reset]);

  return { handleKeyPress, getAndResetTelemetry };
}
