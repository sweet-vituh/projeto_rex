import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "pcm" | "mechanic" | "admin" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  username: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, username")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return { role: null, username: null };
      }

      return { 
        role: data?.role as AppRole || null, 
        username: data?.username || null 
      };
    } catch (error) {
      console.error("Error fetching user role:", error);
      return { role: null, username: null };
    }
  };

  const refreshRole = async () => {
    if (user) {
      const { role: newRole, username: newUsername } = await fetchUserRole(user.id);
      setRole(newRole);
      setUsername(newUsername);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      setUsername(null);
      localStorage.clear();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            const { role: newRole, username: newUsername } = await fetchUserRole(session.user.id);
            setRole(newRole);
            setUsername(newUsername);
            setIsLoading(false);
          }, 0);
        } else {
          setRole(null);
          setUsername(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { role: newRole, username: newUsername } = await fetchUserRole(session.user.id);
        setRole(newRole);
        setUsername(newUsername);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      username, 
      isLoading, 
      signOut,
      refreshRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
