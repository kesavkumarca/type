'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, ADMIN_EMAIL } from '@/config/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  mobile_number: string;
  date_of_birth: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, mobileNumber: string, dateOfBirth: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 🛡️ Helper function to grab profile without causing loop freezes
  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    // 🎯 Set up the listener ONCE
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false; // 🛑 Stops memory leaks and infinite freezes!
      subscription?.unsubscribe();
    };
  }, []); // 🚀 Empty array means this runs EXACTLY ONCE!

  const signUp = async (email: string, password: string, fullName: string, mobileNumber: string, dateOfBirth: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          mobile_number: mobileNumber,
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (authError) throw authError;

    if (authUser) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authUser.id,
          email,
          full_name: fullName,
          mobile_number: mobileNumber,
          date_of_birth: dateOfBirth,
        },
      ]);

      if (profileError) throw profileError;
    }
  };

  const logIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const logOut = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signUp,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};