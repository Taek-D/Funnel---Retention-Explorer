import { describe, it, expect } from 'vitest';
import { parseCSVText } from '../../lib/csvParser';

describe('parseCSVText', () => {
  it('parses valid CSV text', async () => {
    const csv = 'timestamp,user_id,event\n2025-01-01,u1,view\n2025-01-02,u2,click';
    const result = await parseCSVText(csv);
    expect(result.data).toHaveLength(2);
    expect(result.headers).toEqual(['timestamp', 'user_id', 'event']);
    expect(result.data[0]['user_id']).toBe('u1');
  });

  it('skips empty lines', async () => {
    const csv = 'a,b\n1,2\n\n3,4\n';
    const result = await parseCSVText(csv);
    expect(result.data).toHaveLength(2);
  });

  it('rejects CSV exceeding row limit', async () => {
    const header = 'col\n';
    const rows = Array.from({ length: 100_001 }, (_, i) => `row${i}`).join('\n');
    const csv = header + rows;
    await expect(parseCSVText(csv)).rejects.toThrow('행 수가 너무 많습니다');
  });

  it('returns headers from parsed CSV', async () => {
    const csv = 'name,age,city\nAlice,30,Seoul';
    const result = await parseCSVText(csv);
    expect(result.headers).toContain('name');
    expect(result.headers).toContain('age');
    expect(result.headers).toContain('city');
  });

  it('handles single-row CSV', async () => {
    const csv = 'x\n1';
    const result = await parseCSVText(csv);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]['x']).toBe('1');
  });
});
