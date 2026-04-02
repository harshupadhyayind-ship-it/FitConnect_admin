import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import api from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Call backend to register/fetch user and check is_admin
          const res = await api.post('/auth/me');
          if (res.data.is_admin) {
            setUser(firebaseUser);
            setIsAdmin(true);
          } else {
            // Not an admin — sign them out immediately
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
          }
        } catch {
          await signOut(auth);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Verify admin status right after sign-in
    const res = await api.post('/auth/me');
    if (!res.data.is_admin) {
      await signOut(auth);
      throw new Error('Access denied. Your account does not have admin privileges.');
    }
    return result;
  };

  const logout = async () => {
    await api.post('/auth/signout').catch(() => {});
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
