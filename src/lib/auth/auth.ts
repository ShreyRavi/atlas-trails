import { v4 as uuidv4 } from 'uuid';
import { User } from '@/types';

const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@atlastrail.app',
};

const DEMO_PASSWORD = 'demo1234';

const USERS_KEY = 'atlastrail_users';
const SESSION_KEY = 'atlastrail_session';

interface StoredUser {
  id: string;
  email: string;
  password: string;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    // Ensure demo user exists
    if (!stored.find((u: StoredUser) => u.email === DEMO_USER.email)) {
      stored.push({ id: DEMO_USER.id, email: DEMO_USER.email, password: DEMO_PASSWORD });
      localStorage.setItem(USERS_KEY, JSON.stringify(stored));
    }
    return stored;
  } catch {
    return [];
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  const provider = process.env.NEXT_PUBLIC_DB_PROVIDER || 'local';

  if (provider === 'supabase') {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { id: data.user!.id, email: data.user!.email! };
  }

  // Local mode
  const users = getStoredUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const sessionUser: User = { id: user.id, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

export async function signUp(email: string, password: string): Promise<User> {
  const provider = process.env.NEXT_PUBLIC_DB_PROVIDER || 'local';

  if (provider === 'supabase') {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { id: data.user!.id, email: data.user!.email! };
  }

  // Local mode
  const users = getStoredUsers();
  if (users.find((u) => u.email === email)) throw new Error('Email already registered');
  const newUser: StoredUser = { id: uuidv4(), email, password };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const sessionUser: User = { id: newUser.id, email: newUser.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

export function signOut(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
