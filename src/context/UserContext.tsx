'use client'

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export interface UserProfile {
  name: string;
  handle: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  credits: number;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => void;
  signOut: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Rivera",
  handle: "@alexrivera_ai",
  email: "alex@craftai.studio",
  initials: "AR",
  avatarUrl: null,
  credits: 98,
};

const USER_STORAGE_KEY = "craftai_user_profile_v1";

function computeInitials(name: string): string {
  if (!name || !name.trim()) return "AR";
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function parseUserToProfile(user: User): UserProfile {
  const meta = user.user_metadata || {};
  const rawName =
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    user.email?.split("@")[0] ||
    "Creator";

  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const email = user.email || "creator@craftai.studio";
  const handle = `@${(meta.user_name || rawName.toLowerCase().replace(/[^a-z0-9_]/g, "") || "creator")}`;
  const avatarUrl = meta.avatar_url || meta.picture || null;
  const credits = typeof meta.credits === "number" ? meta.credits : 98;

  return {
    name: formattedName,
    handle,
    email,
    initials: computeInitials(formattedName),
    avatarUrl,
    credits,
  };
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: DEFAULT_PROFILE,
  loading: true,
  updateProfile: () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Initialize and listen to Supabase Auth state changes
  useEffect(() => {
    // 1. Check if user modified local profile preferences
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setProfile({
            ...parsed,
            initials: computeInitials(parsed.name),
          });
        }
      }
    } catch {
      // Ignore localStorage error
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 2. Fetch authenticated Supabase user
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      const user = res.data.user;
      if (user) {
        setUser(user);
        const derived = parseUserToProfile(user);
        setProfile(derived);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(derived));
        } catch {
          // Ignore
        }
      }
      setLoading(false);
    });

    // 3. Listen to live auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        const derived = parseUserToProfile(session.user);
        setProfile(derived);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(derived));
        } catch {
          // Ignore
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        ...data,
        initials: data.name ? computeInitials(data.name) : prev.initials,
      };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("craftai_profile_updated"));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const signOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignore
    }
    router.push("/auth/login");
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, updateProfile, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
