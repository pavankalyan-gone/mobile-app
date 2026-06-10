// Decouples the API layer from the auth store so the axios interceptors
// don't need an inline require() of the store (circular dependency).

type Listener = () => void;

const listeners = new Set<Listener>();

export const authEvents = {
  /** Subscribe to "session is no longer valid" events. Returns an unsubscribe fn. */
  onUnauthorized(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  emitUnauthorized(): void {
    listeners.forEach((listener) => listener());
  },
};
