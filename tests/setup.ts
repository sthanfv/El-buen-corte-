import { beforeEach } from 'vitest';

// ✅ Mock localStorage for Vitest
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Set up global localStorage mock
global.localStorage = new LocalStorageMock() as any;

// Clear before each test
beforeEach(() => {
  global.localStorage.clear();
});
