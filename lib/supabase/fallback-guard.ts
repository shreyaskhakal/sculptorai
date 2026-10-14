/**
 * Keep in-memory stores available for explicit demo/offline mode, but never
 * return their data after a request to a configured Supabase project fails.
 */
export function guardFallbackStore<T extends object>(
  store: T,
  isRemoteConfigured: () => boolean
): T {
  return new Proxy(store, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;

      return (...args: unknown[]) => {
        if (isRemoteConfigured()) {
          throw new Error(
            `Supabase operation ${String(property)} failed; refusing to use in-memory data while Supabase is configured.`
          );
        }
        return Reflect.apply(value, target, args);
      };
    },
  });
}
