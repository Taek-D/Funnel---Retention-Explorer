import React from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Eye, EyeOff, Maximize2, Minimize2 } from './Icons';
import type { WidgetId, WidgetWidth } from '../types';

interface DashboardWidgetProps {
  widgetId: WidgetId;
  editMode: boolean;
  visible: boolean;
  width: WidgetWidth;
  index: number;
  totalCount: number;
  onToggleVisibility: () => void;
  onToggleWidth: () => void;
  canResize: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widgetId,
  editMode,
  visible,
  width,
  index,
  totalCount,
  onToggleVisibility,
  onToggleWidth,
  canResize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  children,
}) => {
  const { t } = useTranslation('pages');
  const colSpan = width === 'full' ? 'md:col-span-2' : 'md:col-span-1';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMoveUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMoveDown();
    }
  };

  // Hidden in view mode: don't render
  if (!visible && !editMode) return null;

  // Hidden in edit mode: show collapsed bar
  if (!visible && editMode) {
    return (
      <div
        className={`${colSpan} col-span-1`}
        draggable
        role="listitem"
        aria-roledescription={t('dashboard.a11y.sortableItem')}
        aria-label={t('dashboard.a11y.widgetHiddenLabel', { name: widgetId, pos: index + 1, total: totalCount })}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        data-widget-id={widgetId}
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border border-dashed border-white/10 rounded-lg opacity-50">
          <GripVertical size={14} className="text-slate-600 cursor-grab" aria-hidden="true" />
          <EyeOff size={14} className="text-slate-600" aria-hidden="true" />
          <span className="text-xs text-slate-600 flex-1">{widgetId}</span>
          <button
            onClick={onToggleVisibility}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-accent transition-colors"
            aria-label={t('dashboard.a11y.showWidget')}
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Edit mode: show controls
  if (editMode) {
    return (
      <div
        className={`${colSpan} col-span-1`}
        draggable
        role="listitem"
        aria-roledescription={t('dashboard.a11y.sortableItem')}
        aria-label={t('dashboard.a11y.widgetPosition', { name: widgetId, pos: index + 1, total: totalCount })}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        data-widget-id={widgetId}
      >
        <div className="relative ring-1 ring-accent/20 rounded-lg transition-all">
          {/* Edit toolbar */}
          <div className="flex items-center gap-1 px-3 py-2 bg-accent/5 border-b border-accent/10 rounded-t-lg">
            <GripVertical size={14} className="text-accent/60 cursor-grab mr-1" aria-hidden="true" />
            <span className="text-xs text-accent/80 font-medium flex-1">{widgetId}</span>
            {canResize && (
              <button
                onClick={onToggleWidth}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label={width === 'full' ? t('dashboard.a11y.halfWidth') : t('dashboard.a11y.fullWidth')}
              >
                {width === 'full' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            )}
            <button
              onClick={onToggleVisibility}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-coral transition-colors"
              aria-label={t('dashboard.a11y.hideWidget')}
            >
              <EyeOff size={13} />
            </button>
          </div>
          <div className="pointer-events-none opacity-70">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Normal view mode
  return (
    <div className={`${colSpan} col-span-1`} data-widget-id={widgetId}>
      {children}
    </div>
  );
};
