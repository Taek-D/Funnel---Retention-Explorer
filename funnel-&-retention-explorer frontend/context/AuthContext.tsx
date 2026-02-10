import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchUserProfile, upsertUserProfile } from '../lib/planManager';
import { trackEvent } from '../lib/analytics';
import type { UserProfile } from '../lib/planManager';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    let profile = await fetchUserProfile(userId);
    if (!profile) {
      profile = await upsertUserProfile(userId);
    }
    setUserProfile(profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase가 설정되지 않았습니다.') };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase가 설정되지 않았습니다.') };
    const { error } = await supabase.auth.signUp({ email, password });
    if (!error) {
      trackEvent('signup_complete');
    }
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userProfile, refreshProfile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
