// Safe storage utility that gracefully handles sandboxed iframes and disabled storage
class SafeStorage {
  private mem: Record<string, string> = {};

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // In sandboxed iframes without storage permission or private browsing mode, return in-memory
    }
    return this.mem[key] ?? null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback to memory
    }
    this.mem[key] = value;
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback to memory
    }
    delete this.mem[key];
  }
}

export const safeStorage = new SafeStorage();
