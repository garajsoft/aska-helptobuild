"use client";

import { useEffect, useState } from "react";

export interface AuthUser {
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

/**
 * Client-side session check, for components that need to react to
 * logged-in/out state (route guarding itself happens server-side via
 * checkPrivateAccess in ./gate). Same swap point: this hook and gate.ts
 * are the only two places Memz's auth needs to be wired in.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((j: { user?: AuthUser | null }) => {
        if (!cancelled) setState({ user: j.user ?? null, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
