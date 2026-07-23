/**
 * Tiny external store for the sidebar collapsed preference.
 *
 * Backed by localStorage so the choice survives navigation between sections.
 * Exposed through useSyncExternalStore, which handles SSR correctly: the
 * server always renders the collapsed default and React swaps in the stored
 * value right after hydration — no effects, no hydration mismatch.
 */
const KEY = 'dialektoz:sidebar-collapsed';

const listeners = new Set<() => void>();

export function subscribeSidebar(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Client value. Collapsed unless the user explicitly expanded it. */
export function getSidebarCollapsed(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

/** Server/default value: collapsed. */
export function getSidebarCollapsedServer(): boolean {
  return true;
}

export function setSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(KEY, collapsed ? '1' : '0');
  } catch {
    // storage unavailable (private mode) — keep it in-memory for this session
  }
  listeners.forEach((listener) => listener());
}
