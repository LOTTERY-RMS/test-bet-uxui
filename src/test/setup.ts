import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock fetch for tests
Object.defineProperty(window, "fetch", {
  value: vi.fn(),
});

// Mock matchMedia for Ant Design
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock console methods to avoid noise in tests
Object.defineProperty(window, "console", {
  value: {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
});
