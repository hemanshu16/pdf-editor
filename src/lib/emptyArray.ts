// A single stable reference so Zustand selectors like `s.map[key] ?? EMPTY_ARRAY`
// don't return a fresh array identity on every call (which reads as a state
// change to useSyncExternalStore and causes an infinite render loop).
export const EMPTY_ARRAY: never[] = [];
