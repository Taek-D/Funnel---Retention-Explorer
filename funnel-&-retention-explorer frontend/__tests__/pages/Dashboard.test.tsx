import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../pages/Dashboard';
import { AppProvider, useAppContext } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';
import { DEFAULT_LAYOUT } from '../../lib/constants';

// Mock ALL Icons (including those used by Toast and other sub-components)
vi.mock('../../components/Icons', () => {
  const Icon = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      <span data-testid={`icon-${name}`} {...props} />;
    Component.displayName = name;
    return Component;
  };
  return {
    Info: Icon('Info'),
    Users: Icon('Users'),
    Zap: Icon('Zap'),
    Download: Icon('Download'),
    UploadCloud: Icon('UploadCloud'),
    Sparkles: Icon('Sparkles'),
    Filter: Icon('Filter'),
    ArrowRight: Icon('ArrowRight'),
    Clock: Icon('Clock'),
    Trash2: Icon('Trash2'),
    ChevronRight: Icon('ChevronRight'),
    BarChart2: Icon('BarChart2'),
    Shield: Icon('Shield'),
    AlertTriangle: Icon('AlertTriangle'),
    Settings: Icon('Settings'),
    Check: Icon('Check'),
    RotateCcw: Icon('RotateCcw'),
    LayoutDashboard: Icon('LayoutDashboard'),
    ShoppingBag: Icon('ShoppingBag'),
    Activity: Icon('Activity'),
    ChevronDown: Icon('ChevronDown'),
    ChevronUp: Icon('ChevronUp'),
    Calendar: Icon('Calendar'),
    Camera: Icon('Camera'),
    LoaderCircle: Icon('LoaderCircle'),
    // Toast icons
    CheckCircle: Icon('CheckCircle'),
    AlertCircle: Icon('AlertCircle'),
    X: Icon('X'),
    Plug: Icon('Plug'),
  };
});

// Mock Recharts (render nothing)
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null,
}));

// Mock hooks
const mockExportReport = vi.fn();
const mockExportCSV = vi.fn();
const mockExportExcel = vi.fn();
const mockToggleVisibility = vi.fn();
const mockToggleWidth = vi.fn();
const mockReorder = vi.fn();
const mockResetToDefault = vi.fn();
const mockApplyPreset = vi.fn();
const mockSetEditMode = vi.fn();
let mockEditMode = false;
let mockLayout = [...DEFAULT_LAYOUT];

vi.mock('../../hooks/useExportReport', () => ({
  useExportReport: () => ({
    exportReport: mockExportReport,
    exporting: false,
    isPro: false,
  }),
}));

vi.mock('../../hooks/useDataExport', () => ({
  useDataExport: () => ({
    exportCSV: mockExportCSV,
    exportExcel: mockExportExcel,
    exporting: false,
    isPro: false,
  }),
}));

vi.mock('../../hooks/useSavedAnalyses', () => ({
  useSavedAnalyses: () => ({
    snapshots: [],
    removeSnapshot: vi.fn(),
    saveSnapshot: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDashboardLayout', () => ({
  useDashboardLayout: () => ({
    layout: mockLayout,
    editMode: mockEditMode,
    setEditMode: mockSetEditMode,
    toggleVisibility: mockToggleVisibility,
    toggleWidth: mockToggleWidth,
    reorder: mockReorder,
    resetToDefault: mockResetToDefault,
    applyPreset: mockApplyPreset,
  }),
}));

// Mock ShareButton and ExportDropdown
vi.mock('../../components/ShareButton', () => ({
  ShareButton: () => <button data-testid="share-button">Share</button>,
}));

vi.mock('../../components/ExportDropdown', () => ({
  ExportDropdown: ({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) => (
    <div data-testid="export-dropdown">
      <button data-testid="export-csv" onClick={onCSV}>CSV</button>
      <button data-testid="export-excel" onClick={onExcel}>Excel</button>
    </div>
  ),
}));

// Mock DashboardWidget to pass through
vi.mock('../../components/DashboardWidget', () => ({
  DashboardWidget: ({ children, widgetId, editMode, visible }: {
    children: React.ReactNode;
    widgetId: string;
    editMode: boolean;
    visible: boolean;
  }) => {
    if (!visible && !editMode) return null;
    return <div data-testid={`widget-${widgetId}`}>{children}</div>;
  },
}));

// Mock useClickOutside
vi.mock('../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

// Mock useConnectors
vi.mock('../../hooks/useConnectors', () => ({
  useConnectors: () => ({
    connectors: [],
    syncLogs: [],
    loading: false,
    syncing: null,
    testing: null,
    addConnector: vi.fn(),
    editConnector: vi.fn(),
    removeConnector: vi.fn(),
    syncConnector: vi.fn(),
    testConnection: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock analytics
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: null,
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    userProfile: null,
    loading: false,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/app/dashboard']}>
      <AppProvider>
        <ToastProvider>
          <Dashboard />
        </ToastProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

// Component that injects processedData into context
function DataInjector({ children }: { children: React.ReactNode }) {
  const { dispatch } = useAppContext();
  const injectedRef = React.useRef(false);

  React.useEffect(() => {
    if (injectedRef.current) return;
    injectedRef.current = true;
    dispatch({
      type: 'SET_PROCESSED_DATA',
      payload: [
        { userId: 'u1', eventName: 'signup', timestamp: new Date('2025-01-01'), platform: 'web', channel: 'organic' },
      ],
    });
    dispatch({ type: 'SET_UNIQUE_EVENTS', payload: ['signup'] });
    dispatch({
      type: 'SET_DATA_QUALITY',
      payload: {
        totalRows: 100,
        validRows: 95,
        failedRows: 5,
        uniqueUsers: 80,
        minDate: new Date('2025-01-01'),
        maxDate: new Date('2025-01-31'),
        platformMissingRate: '2%',
        channelMissingRate: '1%',
        topEvents: [],
      },
    });
  }, [dispatch]);

  return <>{children}</>;
}

function renderDashboardWithData() {
  return render(
    <MemoryRouter initialEntries={['/app/dashboard']}>
      <AppProvider>
        <ToastProvider>
          <DataInjector>
            <Dashboard />
          </DataInjector>
        </ToastProvider>
      </AppProvider>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditMode = false;
    mockLayout = [...DEFAULT_LAYOUT];
  });

  describe('empty state (no data)', () => {
    it('renders hero CTA when no data', () => {
      renderDashboard();
      expect(screen.getByText('dashboard.heroTitle')).toBeInTheDocument();
      expect(screen.getByText('dashboard.heroDesc')).toBeInTheDocument();
    });

    it('renders sample data button', () => {
      renderDashboard();
      expect(screen.getByText('dashboard.trySample')).toBeInTheDocument();
    });

    it('renders upload CSV button', () => {
      renderDashboard();
      expect(screen.getByText('dashboard.uploadCsv')).toBeInTheDocument();
    });

    it('navigates to upload with sample param on try sample click', () => {
      renderDashboard();
      fireEvent.click(screen.getByText('dashboard.trySample'));
      expect(mockNavigate).toHaveBeenCalledWith('/app/upload?sample=ecommerce');
    });

    it('navigates to upload on upload CSV click', () => {
      renderDashboard();
      fireEvent.click(screen.getByText('dashboard.uploadCsv'));
      expect(mockNavigate).toHaveBeenCalledWith('/app/upload');
    });

    it('renders feature cards', () => {
      renderDashboard();
      expect(screen.getByText('dashboard.featureFunnel')).toBeInTheDocument();
      expect(screen.getByText('dashboard.featureRetention')).toBeInTheDocument();
      expect(screen.getByText('dashboard.featureAI')).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('renders edit layout toggle button', async () => {
      renderDashboardWithData();
      expect(await screen.findByText('dashboard.editLayout')).toBeInTheDocument();
    });

    it('calls setEditMode when edit button clicked', async () => {
      renderDashboardWithData();
      fireEvent.click(await screen.findByText('dashboard.editLayout'));
      expect(mockSetEditMode).toHaveBeenCalledWith(true);
    });

    it('renders export PNG button', async () => {
      renderDashboardWithData();
      expect(await screen.findByText('dashboard.exportPng')).toBeInTheDocument();
    });

    it('calls exportReport when PNG button clicked', async () => {
      renderDashboardWithData();
      fireEvent.click(await screen.findByText('dashboard.exportPng'));
      expect(mockExportReport).toHaveBeenCalledWith('png');
    });

    it('renders export PDF button', async () => {
      renderDashboardWithData();
      expect(await screen.findByText('dashboard.exportPdf')).toBeInTheDocument();
    });

    it('calls exportReport when PDF button clicked', async () => {
      renderDashboardWithData();
      fireEvent.click(await screen.findByText('dashboard.exportPdf'));
      expect(mockExportReport).toHaveBeenCalledWith('pdf');
    });

    it('renders all visible widgets', async () => {
      renderDashboardWithData();
      // Wait for data injection
      await screen.findByText('dashboard.editLayout');
      for (const item of DEFAULT_LAYOUT.filter(i => i.visible)) {
        expect(screen.getByTestId(`widget-${item.widgetId}`)).toBeInTheDocument();
      }
    });

    it('renders KPI cards section', async () => {
      renderDashboardWithData();
      await screen.findByText('dashboard.editLayout');
      expect(screen.getByTestId('widget-kpi-cards')).toBeInTheDocument();
    });

    it('renders quick actions section', async () => {
      renderDashboardWithData();
      await screen.findByText('dashboard.editLayout');
      expect(screen.getByTestId('widget-quick-actions')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('shows done button text when in edit mode', async () => {
      mockEditMode = true;
      renderDashboardWithData();
      expect(await screen.findByText('dashboard.editDone')).toBeInTheDocument();
    });

    it('shows reset button when in edit mode', async () => {
      mockEditMode = true;
      renderDashboardWithData();
      expect(await screen.findByText('dashboard.resetLayout')).toBeInTheDocument();
    });

    it('calls resetToDefault when reset button clicked', async () => {
      mockEditMode = true;
      renderDashboardWithData();
      fireEvent.click(await screen.findByText('dashboard.resetLayout'));
      expect(mockResetToDefault).toHaveBeenCalledOnce();
    });
  });
});
