import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getHealth } from "../../lib/api/client";

export type HealthStatus = "checking" | "online" | "offline";

const INTERVAL_MS = 30_000;

const HealthContext = createContext<HealthStatus>("checking");

// One shared health check for the whole app (GET /api/v1/health every 30 s).
export function HealthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<HealthStatus>("checking");

  useEffect(() => {
    let current = new AbortController();
    const check = () => {
      current.abort();
      const request = new AbortController();
      current = request;
      getHealth(request.signal)
        .then((r) => setStatus(r.status === "ok" ? "online" : "offline"))
        .catch(() => {
          if (!request.signal.aborted) setStatus("offline");
        });
    };
    check();
    const timer = window.setInterval(check, INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      current.abort();
    };
  }, []);

  return <HealthContext.Provider value={status}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthStatus {
  return useContext(HealthContext);
}
