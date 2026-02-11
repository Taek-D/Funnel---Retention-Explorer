import Papa from 'papaparse';

const MAX_ROW_COUNT = 100_000;

self.onmessage = (e: MessageEvent<{ csvText: string }>) => {
  const { csvText } = e.data;

  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const data = results.data as Record<string, string>[];
      if (data.length > MAX_ROW_COUNT) {
        self.postMessage({
          type: 'error',
          message: `행 수가 너무 많습니다 (${data.length.toLocaleString()}행). 최대 ${MAX_ROW_COUNT.toLocaleString()}행까지 지원합니다.`,
        });
        return;
      }
      self.postMessage({
        type: 'complete',
        data,
        headers: results.meta.fields || [],
        errors: results.errors,
      });
    },
    error: (error: Error) => {
      self.postMessage({ type: 'error', message: error.message });
    },
  });
};
