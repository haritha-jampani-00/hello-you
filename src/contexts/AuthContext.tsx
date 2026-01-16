import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  full_name: string;
  gender: string;
  date_of_birth: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, gender: string, dateOfBirth: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, gender, date_of_birth')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, gender: string, dateOfBirth: string) => {
    // First check if user already exists by attempting to get user with this email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: 'check_existence_dummy_password_that_wont_work',
    });

    // If we get "Email not confirmed" the user exists
    if (signInError && signInError.message.includes('Email not confirmed')) {
      return { error: new Error('You already have an account. Please log in instead.') };
    }

    // Now attempt the actual signup
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          gender: gender,
          date_of_birth: dateOfBirth,
        }
      }
    });

    if (error) {
      return { error };
    }

    // Supabase returns user data even for existing users when signup is attempted
    // Check if this is a new user or existing one by checking identities
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return { error: new Error('You already have an account. Please log in instead.') };
    }

    // Create profile for the new user
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        gender: gender,
        date_of_birth: dateOfBirth,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't block signup if profile creation fails - user can update later
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
