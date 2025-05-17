
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type AuthError
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const SHARED_EMAIL = 'baniksubir@gmail.com'; // Hardcoded shared email

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (pass: string) => Promise<User | null>; // signIn now only takes password
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (pass: string): Promise<User | null> => { // Updated signature
    setLoading(true);
    try {
      // Use the hardcoded SHARED_EMAIL
      const userCredential = await signInWithEmailAndPassword(auth, SHARED_EMAIL, pass);
      setUser(userCredential.user);
      toast({ title: 'Success', description: 'Signed in successfully!' });
      router.push('/'); 
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing in:", authError);
      let description = 'Failed to sign in. Please check your password.';
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
        description = 'Incorrect password. Please try again.';
      } else if (authError.message) {
        description = authError.message;
      }
      toast({ title: 'Sign In Error', description, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      toast({ title: 'Signed Out', description: 'You have been signed out.' });
      router.push('/login'); 
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing out:", authError);
      toast({ title: 'Sign Out Error', description: authError.message || 'Failed to sign out.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
