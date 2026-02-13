import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FarmerProfile {
  name: string;
  phone: string;
  district: string;
  state: string;
  landSize: string;
}

interface AuthContextType {
  farmer: FarmerProfile | null;
  login: (profile: FarmerProfile) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  farmer: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('agrisage_farmer');
    if (stored) setFarmer(JSON.parse(stored));
  }, []);

  const login = (profile: FarmerProfile) => {
    setFarmer(profile);
    localStorage.setItem('agrisage_farmer', JSON.stringify(profile));
  };

  const logout = () => {
    setFarmer(null);
    localStorage.removeItem('agrisage_farmer');
  };

  return (
    <AuthContext.Provider value={{ farmer, login, logout, isLoggedIn: !!farmer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
