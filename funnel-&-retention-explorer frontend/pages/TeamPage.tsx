import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Plus, Trash2, ArrowRight, Mail } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

type TeamRole = 'admin' | 'member' | 'viewer';

type TeamMember = {
  id: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
  pending: boolean;
};

type TeamData = {
  name: string;
  members: TeamMember[];
};

const STORAGE_KEY = 'fre_team_data';

function loadTeamData(userId: string): TeamData {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { name: '', members: [] };
}

function saveTeamData(userId: string, data: TeamData) {
  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));
}

export const TeamPage: React.FC = () => {
  const { t } = useTranslation('pages');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const isTeamPlan = userProfile?.plan === 'team';
  const userId = user?.id ?? 'guest';

  const [teamData, setTeamData] = useState<TeamData>(() => loadTeamData(userId));
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamName, setTeamName] = useState(teamData.name);
  const [saved, setSaved] = useState(false);

  const allMembers = useMemo(() => {
    const currentUser: TeamMember = {
      id: userId,
      email: user?.email ?? 'guest@local',
      role: 'admin',
      joinedAt: new Date().toISOString(),
      pending: false,
    };
    return [currentUser, ...teamData.members];
  }, [teamData.members, userId, user?.email]);

  const handleInvite = useCallback(() => {
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) return;
    if (allMembers.some(m => m.email === email)) return;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      email,
      role: 'member',
      joinedAt: new Date().toISOString(),
      pending: true,
    };
    const updated = { ...teamData, members: [...teamData.members, newMember] };
    setTeamData(updated);
    saveTeamData(userId, updated);
    setInviteEmail('');
  }, [inviteEmail, allMembers, teamData, userId]);

  const handleRemove = useCallback((memberId: string) => {
    const updated = {
      ...teamData,
      members: teamData.members.filter(m => m.id !== memberId),
    };
    setTeamData(updated);
    saveTeamData(userId, updated);
  }, [teamData, userId]);

  const handleRoleChange = useCallback((memberId: string, role: TeamRole) => {
    const updated = {
      ...teamData,
      members: teamData.members.map(m =>
        m.id === memberId ? { ...m, role } : m
      ),
    };
    setTeamData(updated);
    saveTeamData(userId, updated);
  }, [teamData, userId]);

  const handleSaveTeamName = useCallback(() => {
    const updated = { ...teamData, name: teamName };
    setTeamData(updated);
    saveTeamData(userId, updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [teamName, teamData, userId]);

  // Upgrade CTA for non-team users
  if (!isTeamPlan) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="bg-surface border border-white/[0.06] rounded-lg p-10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">{t('teamPage.upgradeRequired')}</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
              {t('teamPage.upgradeDesc')}
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 text-sm font-semibold text-white bg-violet-500 hover:bg-violet-500/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto"
            >
              {t('teamPage.upgradeCTA')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">{t('teamPage.title')}</h2>
        <p className="text-slate-400 text-sm mt-1">{t('teamPage.desc')}</p>
      </div>

      {/* Team Settings */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={14} className="text-violet-400" />
          {t('teamPage.teamSettings')}
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder={t('teamPage.teamNamePlaceholder')}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={handleSaveTeamName}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg transition-colors"
          >
            {saved ? t('teamPage.saved') : t('teamPage.save')}
          </button>
        </div>
      </div>

      {/* Invite Member */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={14} className="text-accent" />
          {t('teamPage.inviteMember')}
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              placeholder={t('teamPage.emailPlaceholder')}
              className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent/50"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim().includes('@')}
            className="px-4 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('teamPage.invite')}
          </button>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={14} className="text-violet-400" />
            {t('teamPage.members')}
          </h3>
          <span className="text-xs text-slate-500">
            {t('teamPage.memberCount', { count: allMembers.length })}
          </span>
        </div>
        <div className="space-y-2">
          {allMembers.map((member, i) => {
            const isCurrentUser = i === 0;
            return (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                    {member.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{member.email}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-accent font-medium shrink-0">{t('teamPage.you')}</span>
                      )}
                      {member.pending && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium shrink-0">
                          {t('teamPage.pending')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('teamPage.joined')}: {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11 sm:pl-0">
                  <select
                    value={member.role}
                    onChange={e => handleRoleChange(member.id, e.target.value as TeamRole)}
                    disabled={isCurrentUser}
                    className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-slate-300 focus:outline-none disabled:opacity-50"
                  >
                    <option value="admin">{t('teamPage.roleAdmin')}</option>
                    <option value="member">{t('teamPage.roleMember')}</option>
                    <option value="viewer">{t('teamPage.roleViewer')}</option>
                  </select>
                  {!isCurrentUser && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-coral hover:bg-coral/10 transition-all shrink-0"
                      title={t('teamPage.remove')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
