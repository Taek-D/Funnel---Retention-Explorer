import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Zap } from '../components/Icons';
import { listProjects, createProject, deleteProject, type FREProject } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const ProjectsPage: React.FC = () => {
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
      toast('error', '프로젝트 로드 실패', err instanceof Error ? err.message : '알 수 없는 오류');
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
      toast('error', '프로젝트 생성 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) return;
    try {
      await deleteProject(id);
      await loadProjects();
    } catch (err) {
      toast('error', '프로젝트 삭제 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">로그인 필요</h2>
        <p className="text-slate-400">프로젝트를 관리하고 분석 결과를 저장하려면 로그인하세요.</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 px-6 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:bg-accent/90 transition-all"
        >
          로그인
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">프로젝트</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-lg transition-all"
        >
          <Plus size={16} />
          새 프로젝트
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">새 프로젝트 만들기</h3>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">프로젝트 이름</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-background border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder="내 분석 프로젝트"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">설명 (선택사항)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-background border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder="1분기 이커머스 퍼널 분석"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2 text-sm font-bold text-white bg-accent hover:bg-accent/90 rounded-lg transition-all disabled:opacity-50"
            >
              {creating ? '생성 중...' : '만들기'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              취소
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
          <h3 className="text-lg font-bold text-white mb-2">아직 프로젝트가 없습니다</h3>
          <p className="text-slate-400 text-sm">분석 결과 저장을 시작하려면 첫 프로젝트를 만드세요.</p>
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
                  삭제
                </button>
              </div>
              <h3 className="text-white font-bold mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}
              <p className="text-slate-500 text-xs">
                업데이트 {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
