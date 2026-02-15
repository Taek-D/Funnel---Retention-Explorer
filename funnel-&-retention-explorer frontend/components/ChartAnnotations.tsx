import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Trash2, Tag } from './Icons';
import type { ChartAnnotation, AnnotationCategory } from '../lib/annotations';
import { ANNOTATION_CATEGORIES, ANNOTATION_COLORS } from '../lib/annotations';

interface AnnotationToggleProps {
  count: number;
  onClick: () => void;
}

export const AnnotationToggle: React.FC<AnnotationToggleProps> = ({ count, onClick }) => {
  const { t } = useTranslation('pages');
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-md transition-colors"
      title={t('annotations.title')}
    >
      <Tag size={13} />
      <span>{t('annotations.title')}</span>
      {count > 0 && (
        <span className="bg-accent/20 text-accent text-[10px] font-mono px-1.5 rounded-full">{count}</span>
      )}
    </button>
  );
};

interface AnnotationFormProps {
  onAdd: (date: string, label: string, category: AnnotationCategory) => void;
  onClose: () => void;
}

export const AnnotationForm: React.FC<AnnotationFormProps> = ({ onAdd, onClose }) => {
  const { t } = useTranslation('pages');
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<AnnotationCategory>('custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !label.trim()) return;
    onAdd(date, label.trim(), category);
    setDate('');
    setLabel('');
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-elevated border border-white/[0.08] rounded-lg p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white font-medium text-xs">{t('annotations.addTitle')}</span>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="w-full bg-surface border border-white/[0.08] rounded px-2 py-1.5 text-white text-xs"
        required
      />
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder={t('annotations.labelPlaceholder')}
        className="w-full bg-surface border border-white/[0.08] rounded px-2 py-1.5 text-white text-xs placeholder:text-slate-500"
        required
        maxLength={50}
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value as AnnotationCategory)}
        className="w-full bg-surface border border-white/[0.08] rounded px-2 py-1.5 text-white text-xs"
      >
        {ANNOTATION_CATEGORIES.map(c => (
          <option key={c} value={c}>{t(`annotations.cat_${c}`)}</option>
        ))}
      </select>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-1 bg-accent hover:bg-accent/90 text-background font-medium rounded px-3 py-1.5 text-xs transition-colors"
      >
        <Plus size={12} />
        {t('annotations.add')}
      </button>
    </form>
  );
};

interface AnnotationListProps {
  annotations: ChartAnnotation[];
  onRemove: (id: string) => void;
}

export const AnnotationList: React.FC<AnnotationListProps> = ({ annotations, onRemove }) => {
  const { t } = useTranslation('pages');

  if (annotations.length === 0) {
    return <p className="text-xs text-slate-500 py-1">{t('annotations.noAnnotations')}</p>;
  }

  return (
    <div className="space-y-1 max-h-[160px] overflow-y-auto">
      {annotations.map(a => (
        <div key={a.id} className="flex items-center gap-2 text-xs group">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
          <span className="text-slate-400 font-mono shrink-0">{a.date}</span>
          <span className="text-white truncate flex-1">{a.label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{t(`annotations.cat_${a.category}`)}</span>
          <button
            onClick={() => onRemove(a.id)}
            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

interface AnnotationPanelProps {
  annotations: ChartAnnotation[];
  onAdd: (date: string, label: string, category: AnnotationCategory) => void;
  onRemove: (id: string) => void;
}

export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ annotations, onAdd, onRemove }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <AnnotationToggle count={annotations.length} onClick={() => setShowForm(prev => !prev)} />
      </div>
      {showForm && <AnnotationForm onAdd={onAdd} onClose={() => setShowForm(false)} />}
      {annotations.length > 0 && <AnnotationList annotations={annotations} onRemove={onRemove} />}
    </div>
  );
};
