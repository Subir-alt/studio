
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updatePassword, // Import updatePassword
  type AuthError
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<boolean>; // Added new method
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

  const signIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      toast({ title: 'Success', description: 'Signed in successfully!' });
      router.push('/'); 
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing in:", authError);
      let description = 'Failed to sign in. Please check your credentials.';
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email') {
        description = 'Incorrect email or password. Please try again.';
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

  const changeUserPassword = async (newPassword: string): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: 'Error', description: 'No user is currently signed in.', variant: 'destructive' });
      return false;
    }
    setLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast({ title: 'Success', description: 'Password updated successfully.' });
      setLoading(false);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error changing password:", authError);
      let description = 'Failed to change password.';
      if (authError.code === 'auth/weak-password') {
        description = 'The new password is too weak. Please choose a stronger password (at least 6 characters).';
      } else if (authError.code === 'auth/requires-recent-login') {
        description = 'This operation is sensitive and requires recent authentication. Please sign out and sign back in to change your password.';
      } else if (authError.message) {
        description = authError.message;
      }
      toast({ title: 'Password Change Error', description, variant: 'destructive' });
      setLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, changeUserPassword }}>
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
