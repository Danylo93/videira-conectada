import { useEffect, useRef, useState } from "react";

/**
 * Mantém o loader visível por, no mínimo, `minDelayMs`.
 * Retorna `true` enquanto o overlay deve ser exibido.
 */
export function useDelayedLoading(ready: boolean, minDelayMs = 1000) {
  const start = useRef<number | null>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (start.current === null) start.current = Date.now();

    if (ready) {
      const elapsed = Date.now() - (start.current ?? Date.now());
      const remain = Math.max(0, minDelayMs - elapsed);
      const t = setTimeout(() => setShow(false), remain);
      return () => clearTimeout(t);
    } else {
      setShow(true);
    }
  }, [ready, minDelayMs]);

  return show;
}
