import { useSyncExternalStore } from 'react';

export type PolicyId = 'A' | 'B' | 'C';
export const POLICY_IDS: PolicyId[] = ['A', 'B', 'C'];

let current: PolicyId = 'A';
const listeners = new Set<() => void>();

export const policyStore = {
  get: () => current,
  set(next: PolicyId) {
    if (next === current) return;
    current = next;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function usePolicy() {
  return useSyncExternalStore(policyStore.subscribe, policyStore.get, policyStore.get);
}
