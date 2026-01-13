import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'welsh' | 'spanish' | 'maori';

type UserContextType = {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);
const STORAGE_KEY = 'selectedLanguage';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('welsh');

  // Load saved language
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) setLanguage(saved as Language);
    });
  }, []);

  // Persist language
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within a UserProvider');
  return ctx;
};
