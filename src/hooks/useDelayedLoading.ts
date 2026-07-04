import { useState, useEffect } from "react";

/**
 * Hook original mantinha um loader visível por um tempo mínimo (minDelayMs).
 * Agora retorna apenas o status real (!ready) para remover carregamentos artificiais.
 */
export function useDelayedLoading(ready: boolean, minDelayMs = 1000) {
  return !ready;
}
