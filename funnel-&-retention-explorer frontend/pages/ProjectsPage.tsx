import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, Zap } from '../components/Icons';
import { listProjects, createProject, deleteProject, type FREProject } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const ProjectsPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<FREProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      toast('error', t('projects.loadFailed'), err instanceof Error ? err.message : '');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject(newName.trim(), newDesc.trim() || undefined);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      await loadProjects();
    } catch (err) {
      toast('error', t('projects.createFailed'), err instanceof Error ? err.message : '');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('projects.deleteConfirm'))) return;
    try {
      await deleteProject(id);
      await loadProjects();
    } catch (err) {
      toast('error', t('projects.deleteFailed'), err instanceof Error ? err.message : '');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">{t('projects.loginRequired')}</h2>
        <p className="text-slate-400">{t('projects.loginDesc')}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent/90 transition-all"
        >
          {t('projects.login')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">{t('projects.title')}</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-lg transition-all"
        >
          <Plus size={16} />
          {t('projects.newProject')}
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">{t('projects.createTitle')}</h3>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('projects.projectName')}</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-background border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder={t('projects.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('projects.description')}</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-background border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder={t('projects.descPlaceholder')}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2 text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-lg transition-all disabled:opacity-50"
            >
              {creating ? t('projects.creating') : t('projects.create')}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {t('projects.cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-12 text-center">
          <FileText size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t('projects.empty')}</h3>
          <p className="text-slate-400 text-sm">{t('projects.emptyDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-surface border border-white/[0.06] rounded-lg p-6 hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => navigate(`/app/dashboard`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                  className="text-slate-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {t('projects.delete')}
                </button>
              </div>
              <h3 className="text-white font-bold mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}
              <p className="text-slate-500 text-xs">
                {t('projects.updated')} {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
