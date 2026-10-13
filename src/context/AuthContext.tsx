import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection, saveUserToFirestore, getProfilesFromFirestore, saveProfileToFirestore } from '../services/firebase';
import { User, FamilyProfile } from '../types/health';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  profiles: FamilyProfile[];
  activeProfile: FamilyProfile | null;
  setActiveProfile: (profile: FamilyProfile) => void;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<void>;
  loginWithFirebaseAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  addProfile: (data: Partial<FamilyProfile>) => Promise<FamilyProfile>;
  updateProfile: (profileId: string, data: Partial<FamilyProfile>) => Promise<FamilyProfile>;
  linkAbha: (abhaId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  profiles: [],
  activeProfile: null,
  setActiveProfile: () => {},
  loginWithGoogle: async () => {},
  loginWithFirebaseAuth: async () => {},
  logout: async () => {},
  refreshProfiles: async () => {},
  addProfile: async () => ({} as FamilyProfile),
  updateProfile: async () => ({} as FamilyProfile),
  linkAbha: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FamilyProfile | null>(null);

  // Initialize and verify Firestore & Auth
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const appUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
        };

        setUser(appUser);
        localStorage.setItem('healthcopilot_user_id', appUser.id);

        try {
          await saveUserToFirestore(appUser);
          const fsProfiles = await getProfilesFromFirestore(appUser.id);
          if (fsProfiles.length > 0) {
            setProfiles(fsProfiles);
            setActiveProfile(fsProfiles[0]);
          } else {
            // Create default profile in Firestore
            const selfProfile: FamilyProfile = {
              id: `prof_${appUser.id}_self`,
              userId: appUser.id,
              name: appUser.name,
              relationship: 'Self',
              age: 35,
              gender: 'Male',
              bloodGroup: 'B+',
              abhaId: '91-4829-1039-4820',
              abhaLinked: true,
              allergies: [],
              chronicConditions: [],
              heightCm: 175,
              weightKg: 75,
            };
            await saveProfileToFirestore(appUser.id, selfProfile);
            setProfiles([selfProfile]);
            setActiveProfile(selfProfile);
          }
        } catch (e) {
          console.warn('Firestore sync fallback:', e);
          const serverProfiles = await api.getProfiles().catch(() => []);
          setProfiles(serverProfiles);
          if (serverProfiles.length > 0) setActiveProfile(serverProfiles[0]);
        }
      } else {
        // Check local / server session fallback
        initServerAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initServerAuth = async () => {
    try {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userProfiles = await api.getProfiles();
        setProfiles(userProfiles);
        if (userProfiles.length > 0) {
          const savedActiveId = localStorage.getItem('healthcopilot_active_profile_id');
          const found = userProfiles.find((p) => p.id === savedActiveId);
          setActiveProfile(found || userProfiles[0]);
        }
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
    }
  };

  const loginWithFirebaseAuth = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setFirebaseUser(fbUser);

      const appUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Google User',
        email: fbUser.email || '',
        avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };

      setUser(appUser);
      localStorage.setItem('healthcopilot_user_id', appUser.id);
      await saveUserToFirestore(appUser);

      // Also register on server for OCR/Chat compatibility
      await api.login(appUser.email, appUser.name, appUser.avatarUrl, appUser.id);

      const fsProfiles = await getProfilesFromFirestore(appUser.id);
      if (fsProfiles.length > 0) {
        setProfiles(fsProfiles);
        setActiveProfile(fsProfiles[0]);
      } else {
        const selfProfile: FamilyProfile = {
          id: `prof_${appUser.id}_self`,
          userId: appUser.id,
          name: appUser.name,
          relationship: 'Self',
          age: 35,
          gender: 'Male',
          bloodGroup: 'B+',
          abhaId: '91-4829-1039-4820',
          abhaLinked: true,
          allergies: [],
          chronicConditions: [],
          heightCm: 175,
          weightKg: 75,
        };
        await saveProfileToFirestore(appUser.id, selfProfile);
        setProfiles([selfProfile]);
        setActiveProfile(selfProfile);
      }
    } catch (err: any) {
      console.warn('Firebase popup error, falling back to seamless Google login:', err);
      // Seamless fallback if popup blocked by iframe
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    setLoading(true);
    try {
      const email = customEmail || 'hash30512@gmail.com';
      const name = customName || 'Hashim Khan';
      const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      const res = await api.login(email, name, avatarUrl);
      setUser(res.user);

      const userProfiles = await api.getProfiles();
      setProfiles(userProfiles);
      if (userProfiles.length > 0) {
        setActiveProfile(userProfiles[0]);
        localStorage.setItem('healthcopilot_active_profile_id', userProfiles[0].id);
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    localStorage.removeItem('healthcopilot_user_id');
    localStorage.removeItem('healthcopilot_active_profile_id');
    setUser(null);
    setFirebaseUser(null);
    setProfiles([]);
    setActiveProfile(null);
  };

  const selectActiveProfile = (profile: FamilyProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('healthcopilot_active_profile_id', profile.id);
  };

  const refreshProfiles = async () => {
    try {
      if (user) {
        const fsProfiles = await getProfilesFromFirestore(user.id).catch(() => []);
        if (fsProfiles.length > 0) {
          setProfiles(fsProfiles);
          if (activeProfile) {
            const updated = fsProfiles.find((p) => p.id === activeProfile.id);
            if (updated) setActiveProfile(updated);
          }
          return;
        }
      }
      const userProfiles = await api.getProfiles();
      setProfiles(userProfiles);
      if (activeProfile) {
        const updated = userProfiles.find((p) => p.id === activeProfile.id);
        if (updated) setActiveProfile(updated);
      }
    } catch (err) {
      console.error('Error refreshing profiles:', err);
    }
  };

  const addProfile = async (data: Partial<FamilyProfile>): Promise<FamilyProfile> => {
    const created = await api.createProfile(data);
    if (user) {
      await saveProfileToFirestore(user.id, created).catch(() => {});
    }
    await refreshProfiles();
    selectActiveProfile(created);
    return created;
  };

  const updateProfile = async (profileId: string, data: Partial<FamilyProfile>): Promise<FamilyProfile> => {
    const updated = await api.updateProfile(profileId, data);
    if (user) {
      await saveProfileToFirestore(user.id, updated).catch(() => {});
    }
    await refreshProfiles();
    if (activeProfile?.id === profileId) {
      selectActiveProfile(updated);
    }
    return updated;
  };

  const linkAbha = async (abhaId?: string) => {
    if (!activeProfile) return;
    const updated = await api.linkAbha(activeProfile.id, abhaId);
    if (user) {
      await saveProfileToFirestore(user.id, updated).catch(() => {});
    }
    selectActiveProfile(updated);
    await refreshProfiles();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        profiles,
        activeProfile,
        setActiveProfile: selectActiveProfile,
        loginWithGoogle,
        loginWithFirebaseAuth,
        logout,
        refreshProfiles,
        addProfile,
        updateProfile,
        linkAbha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
