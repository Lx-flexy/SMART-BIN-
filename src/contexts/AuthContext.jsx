<<<<<<< HEAD
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.uid && userProfile) {
      const unsubscribe = authService.subscribeToUserProfile(user.uid, (profile) => {
        if (profile) {
          setUserProfile(profile);
        }
      });
      return () => unsubscribe();
    }
  }, [user?.uid, userProfile?.uid]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setUserProfile(result.userProfile);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, userData) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.register(email, password, userData);
      setUser(result.user);
      setUserProfile(result.userProfile);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await authService.logout();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    setError(null);
    try {
      const updatedProfile = await authService.updateUserProfile(user.uid, updates);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
=======
import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth'
import { ref, get, set, update } from 'firebase/database'
import { auth, database } from '../config/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup({ email, password, name, role = 'collection_staff', phone = '', zone = '', organization = '' }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await sendEmailVerification(userCredential.user)
    const profile = {
      email,
      name,
      role,
      phone,
      zone,
      organization,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    await set(ref(database, `Users/${userCredential.user.uid}`), profile)
    return userCredential
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const userSnapshot = await get(ref(database, `Users/${userCredential.user.uid}`))
    if (userSnapshot.exists()) {
      setUserRole(userSnapshot.val().role)
      setCurrentUser({ uid: userCredential.user.uid, email: userCredential.user.email, ...userSnapshot.val() })
    } else {
      setCurrentUser({ uid: userCredential.user.uid, email: userCredential.user.email })
    }
    return userCredential
  }

  async function updateUserProfile(updates) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user available')
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await update(ref(database, `Users/${auth.currentUser.uid}`), updatesWithTimestamp)

    if (updates.name || updates.photoURL) {
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: updates.name || auth.currentUser.displayName,
        photoURL: updates.photoURL || auth.currentUser.photoURL
      })
    }

    const userSnapshot = await get(ref(database, `Users/${auth.currentUser.uid}`))
    if (userSnapshot.exists()) {
      setCurrentUser({ uid: auth.currentUser.uid, email: auth.currentUser.email, ...userSnapshot.val() })
      setUserRole(userSnapshot.val().role)
    }

    return { ...updatesWithTimestamp }
  }

  function logout() {
    setUserRole(null)
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userSnapshot = await get(ref(database, `Users/${user.uid}`))
        if (userSnapshot.exists()) {
          setUserRole(userSnapshot.val().role)
          setCurrentUser({ uid: user.uid, email: user.email, ...userSnapshot.val() })
        } else {
          setCurrentUser({ uid: user.uid, email: user.email })
        }
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
>>>>>>> bc7a63e11784e20ae2b9b0f1b42530b93978e951
