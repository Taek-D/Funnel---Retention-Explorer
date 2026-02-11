import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FunnelStep, RetentionCohort, SegmentResult } from '../../types';

// Mock xlsx module
const mockWriteFile = vi.fn();
const mockBookNew = vi.fn().mockReturnValue({ SheetNames: [], Sheets: {} });
const mockBookAppendSheet = vi.fn((wb, ws, name) => {
  wb.SheetNames.push(name);
  wb.Sheets[name] = ws;
});
const mockAoaToSheet = vi.fn().mockReturnValue({
  '!ref': 'A1:D3',
  '!cols': [],
  A1: { v: 'Step' },
});
const mockDecodeRange = vi.fn().mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 2, c: 3 } });
const mockEncodeCell = vi.fn(({ r, c }: { r: number; c: number }) => `${String.fromCharCode(65 + c)}${r + 1}`);

vi.mock('xlsx', () => ({
  default: {
    utils: {
      book_new: () => mockBookNew(),
      book_append_sheet: (...args: unknown[]) => mockBookAppendSheet(...args),
      aoa_to_sheet: (...args: unknown[]) => mockAoaToSheet(...args),
      decode_range: (...args: unknown[]) => mockDecodeRange(...args),
      encode_cell: (...args: unknown[]) => mockEncodeCell(...args),
    },
    writeFile: (...args: unknown[]) => mockWriteFile(...args),
  },
  utils: {
    book_new: () => mockBookNew(),
    book_append_sheet: (...args: unknown[]) => mockBookAppendSheet(...args),
    aoa_to_sheet: (...args: unknown[]) => mockAoaToSheet(...args),
    decode_range: (...args: unknown[]) => mockDecodeRange(...args),
    encode_cell: (...args: unknown[]) => mockEncodeCell(...args),
  },
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

// Fixture data
const funnelData: FunnelStep[] = [
  { step: 'Signup', stepNumber: 1, users: 1000, conversionRate: 100, dropOff: 0 },
  { step: 'Activate', stepNumber: 2, users: 600, conversionRate: 60, dropOff: 400 },
  { step: 'Purchase', stepNumber: 3, users: 200, conversionRate: 20, dropOff: 400 },
];

const retentionData: RetentionCohort[] = [
  { cohortDate: '2025-01', cohortSize: 100, days: { '0': 100, '1': 80, '7': 50 } },
  { cohortDate: '2025-02', cohortSize: 150, days: { '0': 100, '1': 70, '7': 40 } },
];

const segmentData: SegmentResult[] = [
  { name: 'iOS', type: 'platform', population: 500, conversion: 45.2, uplift: 12.3, pValue: 0.03, stepByStep: [] },
  { name: 'Android', type: 'platform', population: 400, conversion: 38.1, uplift: -5.8, pValue: 0.12, stepByStep: [] },
];

describe('excelExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset workbook mock to return fresh objects
    mockBookNew.mockReturnValue({ SheetNames: [], Sheets: {} });
    // Return a more realistic sheet mock with cells
    mockAoaToSheet.mockImplementation((data: unknown[][]) => {
      const ws: Record<string, unknown> = {};
      const rows = data.length;
      const cols = data[0]?.length || 0;
      ws['!ref'] = `A1:${String.fromCharCode(64 + cols)}${rows}`;
      ws['!cols'] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellRef = `${String.fromCharCode(65 + c)}${r + 1}`;
          ws[cellRef] = { v: data[r][c], t: typeof data[r][c] === 'number' ? 'n' : 's' };
        }
      }
      return ws;
    });
    mockDecodeRange.mockImplementation((ref: string) => {
      const parts = ref.split(':');
      const endCol = parts[1].charCodeAt(0) - 65;
      const endRow = parseInt(parts[1].slice(1)) - 1;
      return { s: { r: 0, c: 0 }, e: { r: endRow, c: endCol } };
    });
  });

  describe('exportFunnelExcel', () => {
    it('creates workbook with Funnel sheet', async () => {
      const { exportFunnelExcel } = await import('../../lib/excelExport');
      await exportFunnelExcel(funnelData);

      expect(mockBookNew).toHaveBeenCalled();
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Funnel'
      );
    });

    it('writes file with correct filename pattern', async () => {
      const { exportFunnelExcel } = await import('../../lib/excelExport');
      await exportFunnelExcel(funnelData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^fre-funnel-\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });

    it('includes header row and data rows in sheet', async () => {
      const { exportFunnelExcel } = await import('../../lib/excelExport');
      await exportFunnelExcel(funnelData);

      // aoa_to_sheet should be called with [headers, ...data]
      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      // Header row
      expect(callArgs[0]).toHaveLength(4);
      // Data rows: one per funnel step
      expect(callArgs).toHaveLength(1 + funnelData.length);
    });

    it('converts conversionRate to decimal for percentage formatting', async () => {
      const { exportFunnelExcel } = await import('../../lib/excelExport');
      await exportFunnelExcel(funnelData);

      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      // Row 1 (first data): conversionRate 100 → 1.0
      expect(callArgs[1][2]).toBe(1);
      // Row 2: conversionRate 60 → 0.6
      expect(callArgs[2][2]).toBe(0.6);
    });
  });

  describe('exportRetentionExcel', () => {
    it('creates workbook with Retention sheet', async () => {
      const { exportRetentionExcel } = await import('../../lib/excelExport');
      await exportRetentionExcel(retentionData);

      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Retention'
      );
    });

    it('writes file with correct filename pattern', async () => {
      const { exportRetentionExcel } = await import('../../lib/excelExport');
      await exportRetentionExcel(retentionData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^fre-retention-\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });

    it('does nothing for empty retention data', async () => {
      const { exportRetentionExcel } = await import('../../lib/excelExport');
      await exportRetentionExcel([]);

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('includes day columns sorted numerically', async () => {
      const { exportRetentionExcel } = await import('../../lib/excelExport');
      await exportRetentionExcel(retentionData);

      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      const headers = callArgs[0] as string[];
      // Should have cohort, cohortSize, Day 0, Day 1, Day 7
      expect(headers).toHaveLength(5);
      expect(headers[2]).toBe('Day 0');
      expect(headers[3]).toBe('Day 1');
      expect(headers[4]).toBe('Day 7');
    });

    it('converts day values to decimals for percentage', async () => {
      const { exportRetentionExcel } = await import('../../lib/excelExport');
      await exportRetentionExcel(retentionData);

      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      // Row 1 (first cohort): Day 0 = 100 → 1.0, Day 1 = 80 → 0.8
      expect(callArgs[1][2]).toBe(1);
      expect(callArgs[1][3]).toBe(0.8);
      expect(callArgs[1][4]).toBe(0.5);
    });
  });

  describe('exportSegmentExcel', () => {
    it('creates workbook with Segments sheet', async () => {
      const { exportSegmentExcel } = await import('../../lib/excelExport');
      await exportSegmentExcel(segmentData);

      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Segments'
      );
    });

    it('writes file with correct filename', async () => {
      const { exportSegmentExcel } = await import('../../lib/excelExport');
      await exportSegmentExcel(segmentData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^fre-segment-\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });

    it('includes 6 header columns', async () => {
      const { exportSegmentExcel } = await import('../../lib/excelExport');
      await exportSegmentExcel(segmentData);

      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      expect(callArgs[0]).toHaveLength(6);
    });

    it('converts conversion and uplift to decimals', async () => {
      const { exportSegmentExcel } = await import('../../lib/excelExport');
      await exportSegmentExcel(segmentData);

      const callArgs = mockAoaToSheet.mock.calls[0][0] as unknown[][];
      // iOS: conversion 45.2 → 0.452, uplift 12.3 → 0.123
      expect(callArgs[1][3]).toBeCloseTo(0.452);
      expect(callArgs[1][4]).toBeCloseTo(0.123);
    });
  });

  describe('exportAllAsExcel', () => {
    it('creates multi-sheet workbook', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel(funnelData, retentionData, segmentData);

      expect(mockBookAppendSheet).toHaveBeenCalledTimes(3);
      expect(mockBookAppendSheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Funnel');
      expect(mockBookAppendSheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Retention');
      expect(mockBookAppendSheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Segments');
    });

    it('writes file with analytics filename', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel(funnelData, retentionData, segmentData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^fre-analytics-\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });

    it('skips null data sections', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel(funnelData, null, null);

      expect(mockBookAppendSheet).toHaveBeenCalledTimes(1);
      expect(mockBookAppendSheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'Funnel');
    });

    it('skips empty array data sections', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel([], retentionData, []);

      // Only Retention should be added
      expect(mockBookAppendSheet).toHaveBeenCalledTimes(1);
    });

    it('does not write file when all data is empty', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel(null, null, null);

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('does not write file when all arrays are empty', async () => {
      const { exportAllAsExcel } = await import('../../lib/excelExport');
      await exportAllAsExcel([], [], []);

      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });
});
