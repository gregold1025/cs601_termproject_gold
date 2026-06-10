// useLocalStorage — typed useState wrapper that mirrors to window.localStorage.
//
// Reads on mount (JSON-parsed) and writes on every value change. Silently
// degrades to in-memory state when storage is unavailable (private mode,
// quota, etc.). Suitable for small client-side artifacts like the dance
// move library — when persistence moves to a backend, swap this hook for
// a fetch-backed equivalent without changing call sites.

import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded / private mode — drop the write silently.
    }
  }, [key, value]);

  return [value, setValue];
}
