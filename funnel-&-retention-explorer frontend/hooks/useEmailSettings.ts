import { useState, useCallback, useEffect } from 'react';

interface EmailSettings {
  webhookUrl: string;
  recipientEmails: string;
  autoSend: boolean;
}

const STORAGE_KEY = 'n8nSettings';

function loadSettings(): EmailSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        webhookUrl: parsed.webhookUrl || '',
        recipientEmails: parsed.recipientEmails || '',
        autoSend: parsed.autoSend ?? true,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { webhookUrl: '', recipientEmails: '', autoSend: true };
}

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>(loadSettings);
  const [testing, setTesting] = useState(false);

  const updateSettings = useCallback((partial: Partial<EmailSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!settings.webhookUrl.trim()) return false;
    setTesting(true);
    try {
      const res = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          timestamp: new Date().toISOString(),
          message: 'FRE Analytics connection test',
        }),
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setTesting(false);
    }
  }, [settings.webhookUrl]);

  const sendReport = useCallback(async (reportData: Record<string, unknown>): Promise<boolean> => {
    if (!settings.webhookUrl.trim()) return false;
    try {
      const res = await fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          timestamp: new Date().toISOString(),
          recipients: settings.recipientEmails.split(',').map(e => e.trim()).filter(Boolean),
          data: reportData,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [settings.webhookUrl, settings.recipientEmails]);

  return {
    settings,
    updateSettings,
    saveSettings,
    testConnection,
    sendReport,
    testing,
  };
}
