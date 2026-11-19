'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Options<T> = {
  resourceKey: string;
  enabled: boolean;
  load: () => Promise<T>;
  initialData: T;
  equals: (previous: T, next: T) => boolean;
  errorMessage: string;
  intervalMs?: number;
};

type Snapshot<T> = {
  key: string;
  data: T;
};

export function usePollingResource<T>({
  resourceKey,
  enabled,
  load,
  initialData,
  equals,
  errorMessage,
  intervalMs = 5000,
}: Options<T>) {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    key: resourceKey,
    data: initialData,
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; message: string } | null>(null);
  const refreshRef = useRef<() => void>(() => {});
  const refresh = useCallback(() => refreshRef.current(), []);

  useEffect(() => {
    let active = true;
    let running = false;
    let pending = false;

    setSnapshot((prev) => (prev.key === resourceKey ? prev : { key: resourceKey, data: initialData }));
    setLoadingKey(null);
    setErrorState(null);

    if (!enabled) {
      refreshRef.current = () => {};
      return;
    }

    async function fetchData(initial = false): Promise<void> {
      if (running) {
        pending = true;
        return;
      }

      running = true;
      if (initial) setLoadingKey(resourceKey);

      try {
        const next = await load();
        if (active) {
          setSnapshot((previous) => {
            if (previous.key === resourceKey && equals(previous.data, next)) {
              return previous;
            }
            return { key: resourceKey, data: next };
          });
          setErrorState(null);
        }
      } catch {
        if (active && initial) {
          setErrorState({ key: resourceKey, message: errorMessage });
        }
      } finally {
        running = false;
        if (active && initial) setLoadingKey(null);
        if (active && pending) {
          pending = false;
          void fetchData();
        }
      }
    }

    const trigger = () => { void fetchData(); };
    refreshRef.current = trigger;
    void fetchData(true);

    const timer = window.setInterval(trigger, intervalMs);
    return () => {
      active = false;
      window.clearInterval(timer);
      if (refreshRef.current === trigger) refreshRef.current = () => {};
    };
  }, [resourceKey, enabled, load, initialData, equals, errorMessage, intervalMs]);

  return {
    data: snapshot.key === resourceKey ? snapshot.data : initialData,
    loading: loadingKey === resourceKey,
    error: errorState?.key === resourceKey ? errorState.message : '',
    refresh,
  };
}
