import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';

export interface FarmerProfile {
  name: string;
  phone: string;
  district: string;
  state: string;
  landSize?: string;
  soilType?: string;
  lastAnalysisDate?: string;
}

interface AuthContextType {
  farmer: FarmerProfile | null;
  login: (profile: FarmerProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<FarmerProfile>) => void;
  isLoggedIn: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  farmer: null,
  login: () => {},
  logout: () => {},
  updateProfile: () => {},
  isLoggedIn: false,
  isLoaded: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: isAuthLoaded, isSignedIn } = useClerkAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const storageKey = user ? `agrisage_farmer_${user.id}` : null;

  const baseProfile = useMemo<FarmerProfile | null>(() => {
    if (!user) return null;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      'Farmer';

    return {
      name,
      phone: user.primaryPhoneNumber?.phoneNumber ?? '',
      district: '',
      state: '',
    };
  }, [user]);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) return;
    if (!isSignedIn || !baseProfile || !storageKey) {
      setFarmer(null);
      return;
    }

    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setFarmer(baseProfile);
      localStorage.setItem(storageKey, JSON.stringify(baseProfile));
      return;
    }

    try {
      const stored = JSON.parse(raw) as Partial<FarmerProfile>;
      const hydrated: FarmerProfile = {
        ...baseProfile,
        ...stored,
      };
      setFarmer(hydrated);
      localStorage.setItem(storageKey, JSON.stringify(hydrated));
    } catch {
      setFarmer(baseProfile);
      localStorage.setItem(storageKey, JSON.stringify(baseProfile));
    }
  }, [baseProfile, isAuthLoaded, isSignedIn, isUserLoaded, storageKey]);

  const login = useCallback(
    (profile: FarmerProfile) => {
      if (!storageKey) return;
      setFarmer(profile);
      localStorage.setItem(storageKey, JSON.stringify(profile));
    },
    [storageKey],
  );

  const logout = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setFarmer(null);
    void signOut();
  }, [signOut, storageKey]);

  const updateProfile = useCallback(
    (updates: Partial<FarmerProfile>) => {
      if (!storageKey || !baseProfile) return;

      setFarmer((current) => {
        const updated = { ...(current ?? baseProfile), ...updates };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [baseProfile, storageKey],
  );

  const value = useMemo(
    () => ({
      farmer,
      login,
      logout,
      updateProfile,
      isLoggedIn: Boolean(isAuthLoaded && isSignedIn),
      isLoaded: Boolean(isAuthLoaded && isUserLoaded),
    }),
    [farmer, isAuthLoaded, isSignedIn, isUserLoaded, login, logout, updateProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
