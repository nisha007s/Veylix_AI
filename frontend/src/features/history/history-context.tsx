import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { newId } from "../../lib/utils";
import type { AnyScanResult } from "../../types/api";

// Session-only history: results live in memory for this tab and disappear on
// refresh. Guest scans are never persisted (PRD §13.4, SRS FR-024). Only the
// API result is kept; the submitted URL or email text is never stored.

export interface HistoryEntry {
  id: string;
  result: AnyScanResult;
}

interface HistoryValue {
  entries: HistoryEntry[];
  add: (result: AnyScanResult) => string;
  get: (id: string) => HistoryEntry | undefined;
  clear: () => void;
}

const MAX_ENTRIES = 100;

const HistoryContext = createContext<HistoryValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const add = useCallback((result: AnyScanResult) => {
    const id = newId();
    setEntries((prev) => [{ id, result }, ...prev].slice(0, MAX_ENTRIES));
    return id;
  }, []);

  const get = useCallback((id: string) => entries.find((e) => e.id === id), [entries]);
  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(() => ({ entries, add, get, clear }), [entries, add, get, clear]);
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used inside <HistoryProvider>");
  return ctx;
}
