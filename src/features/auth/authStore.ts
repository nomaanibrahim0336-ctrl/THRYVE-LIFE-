import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  /** True until the initial session check + listener are wired up. */
  initializing: boolean;
  init: () => () => void;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

/**
 * Auth via Supabase email OTP (magic code). In local-only mode (no backend
 * configured) auth is skipped entirely — the app is fully usable signed-out.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initializing: true,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ initializing: false });
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initializing: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
    return () => sub.subscription.unsubscribe();
  },

  signInWithOtp: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  },

  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
