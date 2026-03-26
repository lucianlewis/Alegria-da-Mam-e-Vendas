interface GuardState {
  attempts: number;
  lockedUntil: number | null;
}

const state: GuardState = { attempts: 0, lockedUntil: null };

export function isLocked(): boolean {
  if (state.lockedUntil && Date.now() < state.lockedUntil) return true;
  if (state.lockedUntil && Date.now() >= state.lockedUntil) {
    state.lockedUntil = null; // Expirou
  }
  return false;
}

export function getLockRemaining(): number {
  if (!state.lockedUntil) return 0;
  return Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000));
}

export function recordFailure(): void {
  state.attempts++;
  if (state.attempts >= 10) {
    state.lockedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24h
  } else if (state.attempts >= 8) {
    state.lockedUntil = Date.now() + 60 * 60 * 1000;      // 1h
  } else if (state.attempts >= 5) {
    state.lockedUntil = Date.now() + 15 * 60 * 1000;      // 15min
  }
}

export function recordSuccess(): void {
  state.attempts = 0;
  state.lockedUntil = null;
}
