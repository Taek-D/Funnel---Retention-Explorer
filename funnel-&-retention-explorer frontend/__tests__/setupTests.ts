import '@testing-library/jest-dom';

// Shared mock t function for i18n
const mockT = (key: string, opts?: Record<string, unknown>) => {
  if (opts) {
    return Object.entries(opts).reduce(
      (str, [k, v]) => str.replace(`{{${k}}}`, String(v)),
      key
    );
  }
  return key;
};

// Mock react-i18next (for hooks/components using useTranslation)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'ko', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Mock lib/i18n (for class components and pure modules using i18n.t directly)
vi.mock('../lib/i18n', () => ({
  default: {
    t: mockT,
    language: 'ko',
    changeLanguage: vi.fn(),
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
  },
}));

// Mock window.matchMedia (Tailwind/responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

// Mock ResizeObserver (Recharts)
vi.stubGlobal('ResizeObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

// Mock Sentry (passthrough spans, no-op capture)
vi.mock('../lib/sentry', () => ({
  Sentry: {
    captureException: vi.fn(),
    init: vi.fn(),
    browserTracingIntegration: vi.fn(),
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  },
  initSentry: vi.fn(),
  startSpan: vi.fn((_name: string, _op: string, fn: () => unknown) => fn()),
  startSpanAsync: vi.fn((_name: string, _op: string, fn: () => Promise<unknown>) => fn()),
}));
