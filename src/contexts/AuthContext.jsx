import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataService } from '../services/dataService';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'vdmig_current_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load authenticated user & profile
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            const userProfile = await dataService.getProfileById(session.user.id);
            setProfile(userProfile);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser(session.user);
              const userProfile = await dataService.getProfileById(session.user.id);
              setProfile(userProfile);
            } else {
              setUser(null);
              setProfile(null);
            }
            setLoading(false);
          });

          setLoading(false);
          return () => subscription.unsubscribe();
        } else {
          // Local storage session
          const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
          if (savedAuth) {
            try {
              const savedProfile = JSON.parse(savedAuth);
              if (savedProfile?.id) {
                const freshProfile = await dataService.getProfileById(savedProfile.id);
                if (freshProfile) {
                  setUser({ id: freshProfile.id, email: freshProfile.email });
                  setProfile(freshProfile);
                } else {
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                }
              }
            } catch (e) {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const updated = await dataService.getProfileById(user.id);
      if (updated) {
        setProfile(updated);
        if (!isSupabaseConfigured) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const login = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userProfile = await dataService.getProfileById(data.user.id);
      setUser(data.user);
      setProfile(userProfile);
      return { user: data.user, profile: userProfile };
    }

    // Local authentication check
    const profiles = await dataService.getProfiles();
    const matched = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!matched) {
      throw new Error('Invalid email or password');
    }
    setUser({ id: matched.id, email: matched.email });
    setProfile(matched);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
    return { user: { id: matched.id, email: matched.email }, profile: matched };
  };

  const register = async ({ fullName, phone, email, password, photoFile }) => {
    let photoUrl = '';
    if (photoFile) {
      photoUrl = await dataService.uploadFile('avatars', photoFile, `profile-${Date.now()}`);
    }

    // If this is the very first registered user in the system, grant super_admin and approved status
    const existingProfiles = await dataService.getProfiles();
    const isFirstUser = existingProfiles.length === 0;
    const assignedRole = isFirstUser ? 'super_admin' : 'member';
    const assignedStatus = isFirstUser ? 'approved' : 'pending';

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            profile_photo_url: photoUrl,
            role: assignedRole,
          },
        },
      });
      if (error) throw error;

      const newProfile = await dataService.getProfileById(data.user.id);
      setUser(data.user);
      setProfile(newProfile);
      return { user: data.user, profile: newProfile };
    }

    // Local clean registration
    const newId = `usr-${Date.now()}`;
    const newProfile = await dataService.createProfile({
      id: newId,
      name: fullName,
      phone,
      email,
      role: assignedRole,
      status: assignedStatus,
      profile_photo_url: photoUrl,
    });

    // Notify existing leaders of new registration if any
    const allProfiles = await dataService.getProfiles();
    const leaders = allProfiles.filter(p => p.role === 'super_admin' || p.role === 'leader');
    for (const leader of leaders) {
      if (leader.id !== newId) {
        await dataService.createNotification({
          user_id: leader.id,
          title: 'புதிய உறுப்பினர் பதிவு (New Registration)',
          message: `${fullName} (${phone}) உறுப்பினர் சேர்க்கைக்கு பதிவு செய்துள்ளார்.`,
          type: 'approval',
          link: '/members',
        });
      }
    }

    setUser({ id: newId, email });
    setProfile(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newProfile));
    return { user: { id: newId, email }, profile: newProfile };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (updateFields) => {
    if (!user) return;
    const updated = await dataService.updateProfileInfo(user.id, updateFields);
    setProfile(updated);
    if (!isSupabaseConfigured) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  };

  const isSuperAdmin = profile?.role === 'super_admin' && profile?.status === 'approved';
  const isLeader = (profile?.role === 'super_admin' || profile?.role === 'leader') && profile?.status === 'approved';
  const isPaymentCollector = (profile?.role === 'super_admin' || profile?.role === 'payment_collector') && profile?.status === 'approved';
  const isApproved = profile?.status === 'approved';
  const isPending = profile?.status === 'pending';
  const isBlocked = profile?.status === 'blocked';
  const isRejected = profile?.status === 'rejected';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        updateProfile,
        isSuperAdmin,
        isLeader,
        isPaymentCollector,
        isApproved,
        isPending,
        isBlocked,
        isRejected,
        role: profile?.role || 'member',
        status: profile?.status || 'pending',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
