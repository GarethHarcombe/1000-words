
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Language = 'welsh' | 'spanish' | 'maori'; // add more as you add datasets

type UserContextType = {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedLanguage';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'welsh';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return (saved as Language) || 'welsh';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within a UserProvider');
  return ctx;
};
