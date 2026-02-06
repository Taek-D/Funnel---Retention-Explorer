import React, { useState } from 'react';
import { Download, CheckCircle } from './Icons';
import { useAuth } from '../context/AuthContext';
import { saveSnapshot } from '../lib/supabaseData';

interface SaveAnalysisButtonProps {
  datasetId: string | null;
  snapshotType: string;
  config: Record<string, any>;
  results: Record<string, any>;
}

export const SaveAnalysisButton: React.FC<SaveAnalysisButtonProps> = ({
  datasetId,
  snapshotType,
  config,
  results,
}) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user || !datasetId) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSnapshot({
        datasetId,
        snapshotType,
        config,
        results,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        saved
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
      } disabled:opacity-50`}
    >
      {saved ? (
        <>
          <CheckCircle size={16} />
          Saved
        </>
      ) : (
        <>
          <Download size={16} />
          {saving ? 'Saving...' : 'Save to Cloud'}
        </>
      )}
    </button>
  );
};
