import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Pencil, Trash2, X, Layers, ArrowRightLeft, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { usePlanGate } from '../hooks/usePlanGate';
import {
  listCustomEvents,
  createCustomEvent,
  updateCustomEvent,
  deleteCustomEvent,
} from '../lib/supabaseData';
import type { CustomEventDefinition, CustomEventCondition, CustomEventType } from '../types';

const LOCAL_KEY = 'fre_custom_events';
const FREE_LIMIT = 5;

function loadLocalEvents(): CustomEventDefinition[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch { return []; }
}
function saveLocalEvents(events: CustomEventDefinition[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(events));
}

export default function CustomEventsPage() {
  const { t } = useTranslation('pages');
  const { t: tc } = useTranslation('common');
  const { user } = useAuth();
  const { state } = useAppContext();
  const { toast } = useToast();
  const { isPro } = usePlanGate();

  const [events, setEvents] = useState<CustomEventDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CustomEventDefinition | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formType, setFormType] = useState<CustomEventType>('alias');
  const [formSourceEvent, setFormSourceEvent] = useState('');
  const [formSourceEvents, setFormSourceEvents] = useState<string[]>([]);
  const [formConditions, setFormConditions] = useState<CustomEventCondition[]>([]);

  const uniqueEvents = state.uniqueEvents;
  const uniquePlatforms = [...new Set(state.processedData.map(e => e.platform).filter(Boolean))] as string[];
  const uniqueChannels = [...new Set(state.processedData.map(e => e.channel).filter(Boolean))] as string[];

  const loadEvents = useCallback(async () => {
    setLoading(true);
    if (user) {
      const data = await listCustomEvents(user.id);
      setEvents(data);
    } else {
      setEvents(loadLocalEvents());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormType('alias');
    setFormSourceEvent('');
    setFormSourceEvents([]);
    setFormConditions([]);
    setEditingEvent(null);
  };

  const openCreate = () => {
    if (!isPro && events.length >= FREE_LIMIT) {
      toast('warning', t('customEvents.limitReached'));
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const openEdit = (ev: CustomEventDefinition) => {
    setEditingEvent(ev);
    setFormName(ev.name);
    setFormDesc(ev.description);
    setFormType(ev.type);
    setFormSourceEvent(ev.sourceEvent || '');
    setFormSourceEvents(ev.sourceEvents || []);
    setFormConditions(ev.conditions || []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      type: formType,
      sourceEvent: formType !== 'group' ? formSourceEvent : undefined,
      sourceEvents: formType === 'group' ? formSourceEvents : undefined,
      conditions: formType === 'conditional' ? formConditions : undefined,
    };

    if (user) {
      if (editingEvent) {
        await updateCustomEvent(editingEvent.id, payload);
      } else {
        await createCustomEvent({ user_id: user.id, ...payload });
      }
    } else {
      // Guest mode: localStorage
      const local = loadLocalEvents();
      if (editingEvent) {
        const idx = local.findIndex(e => e.id === editingEvent.id);
        if (idx >= 0) local[idx] = { ...local[idx], ...payload, updated_at: new Date().toISOString() };
      } else {
        local.push({
          id: `local-${Date.now()}`,
          user_id: 'guest',
          project_id: null,
          ...payload,
          description: payload.description || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as CustomEventDefinition);
      }
      saveLocalEvents(local);
    }

    setShowModal(false);
    resetForm();
    await loadEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('customEvents.deleteConfirm'))) return;
    if (user) {
      await deleteCustomEvent(id);
    } else {
      const local = loadLocalEvents().filter(e => e.id !== id);
      saveLocalEvents(local);
    }
    await loadEvents();
  };

  const toggleSourceEvent = (ev: string) => {
    setFormSourceEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  };

  const addCondition = () => {
    if (formConditions.length >= 3) return;
    setFormConditions([...formConditions, { field: 'platform', operator: 'eq', value: '' }]);
  };

  const updateCondition = (idx: number, key: keyof CustomEventCondition, value: string) => {
    const updated = [...formConditions];
    (updated[idx] as unknown as Record<string, string>)[key] = value;
    setFormConditions(updated);
  };

  const removeCondition = (idx: number) => {
    setFormConditions(formConditions.filter((_, i) => i !== idx));
  };

  const typeIcon = (type: CustomEventType) => {
    if (type === 'alias') return <ArrowRightLeft size={14} className="text-blue-400" />;
    if (type === 'group') return <Layers size={14} className="text-green-400" />;
    return <Filter size={14} className="text-yellow-400" />;
  };

  const typeLabel = (type: CustomEventType) => {
    if (type === 'alias') return t('customEvents.alias');
    if (type === 'group') return t('customEvents.group');
    return t('customEvents.conditional');
  };

  const mappingLabel = (ev: CustomEventDefinition) => {
    if (ev.type === 'alias') return ev.sourceEvent || '-';
    if (ev.type === 'group') return `${ev.sourceEvents?.length || 0} ${t('customEvents.events')}`;
    return `${ev.sourceEvent || '-'} + ${ev.conditions?.length || 0} cond`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Tag size={20} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('customEvents.title')}</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> {t('customEvents.newEvent')}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">{tc('loading')}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">{t('customEvents.noEvents')}</h3>
          <p className="text-slate-400 text-sm">{t('customEvents.noEventsDesc')}</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-slate-400 uppercase font-bold px-4 py-3">#</th>
                <th className="text-left text-xs text-slate-400 uppercase font-bold px-4 py-3">{t('customEvents.name')}</th>
                <th className="text-left text-xs text-slate-400 uppercase font-bold px-4 py-3">{t('customEvents.type')}</th>
                <th className="text-left text-xs text-slate-400 uppercase font-bold px-4 py-3">{t('customEvents.mapping')}</th>
                <th className="text-right text-xs text-slate-400 uppercase font-bold px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{ev.name}</div>
                    {ev.description && <div className="text-xs text-slate-500 mt-0.5">{ev.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      {typeIcon(ev.type)} {typeLabel(ev.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 font-mono text-xs">{mappingLabel(ev)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(ev)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">
                {editingEvent ? t('customEvents.editEvent') : t('customEvents.newEvent')}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.name')}</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent/50 outline-none"
                  placeholder="e.g., All Purchases"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.description')}</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent/50 outline-none"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.type')}</label>
                <div className="flex gap-2">
                  {(['alias', 'group', 'conditional'] as CustomEventType[]).map(tp => (
                    <button
                      key={tp}
                      onClick={() => setFormType(tp)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                        formType === tp
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-background border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {typeLabel(tp)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alias: single source event */}
              {formType === 'alias' && (
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.sourceEvent')}</label>
                  <select
                    value={formSourceEvent}
                    onChange={e => setFormSourceEvent(e.target.value)}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="">{t('customEvents.sourceEvent')}</option>
                    {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}

              {/* Group: multi-select */}
              {formType === 'group' && (
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.sourceEvents')}</label>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 bg-background border border-white/10 rounded-lg">
                    {uniqueEvents.map(e => (
                      <button
                        key={e}
                        onClick={() => toggleSourceEvent(e)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          formSourceEvents.includes(e) ? 'bg-accent text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditional: source event + conditions */}
              {formType === 'conditional' && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.sourceEvent')}</label>
                    <select
                      value={formSourceEvent}
                      onChange={e => setFormSourceEvent(e.target.value)}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">{t('customEvents.sourceEvent')}</option>
                      {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1.5 block">{t('customEvents.conditions')}</label>
                    <div className="space-y-2">
                      {formConditions.map((cond, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-background border border-white/10 rounded-lg">
                          <select
                            value={cond.field}
                            onChange={e => updateCondition(idx, 'field', e.target.value)}
                            className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="platform">Platform</option>
                            <option value="channel">Channel</option>
                          </select>
                          <select
                            value={cond.operator}
                            onChange={e => updateCondition(idx, 'operator', e.target.value)}
                            className="bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="eq">{t('customEvents.equals')}</option>
                            <option value="neq">{t('customEvents.notEquals')}</option>
                          </select>
                          <select
                            value={cond.value}
                            onChange={e => updateCondition(idx, 'value', e.target.value)}
                            className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-xs text-white"
                          >
                            <option value="">{t('customEvents.value')}</option>
                            {(cond.field === 'platform' ? uniquePlatforms : uniqueChannels).map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <button onClick={() => removeCondition(idx)} className="text-slate-400 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {formConditions.length < 3 && (
                        <button
                          onClick={addCondition}
                          className="text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                          + {t('customEvents.addCondition')}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                {t('customEvents.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('customEvents.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
