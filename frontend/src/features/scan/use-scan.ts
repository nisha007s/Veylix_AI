import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, friendlyMessage } from "../../lib/api/client";

type State<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: T }
  | { status: "error"; error: ApiError };

// Runs one scan request at a time; a new scan or leaving the page cancels the old one.
export function useScan<T>(scan: (input: string, signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<State<T>>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const run = useCallback(
    async (input: string): Promise<T | undefined> => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setState({ status: "loading" });
      try {
        const result = await scan(input, current.signal);
        if (current.signal.aborted) return undefined;
        setState({ status: "success", result });
        return result;
      } catch (err) {
        if (current.signal.aborted) return undefined;
        const error =
          err instanceof ApiError ? err : new ApiError("internal_error", 0, friendlyMessage("internal_error"));
        setState({ status: "error", error });
        return undefined;
      }
    },
    [scan],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);
  return { state, run, reset };
}
