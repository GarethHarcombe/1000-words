import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native'; // Add this import

export type Language = 'welsh' | 'spanish' | 'maori';

type UserContextType = {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedLanguage';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('welsh');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        console.log('Loading language from AsyncStorage...');
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        console.log('Saved language:', saved);
        if (saved) {
          setLanguage(saved as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        console.log('Language loading complete');
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Persist language
  useEffect(() => {
    if (!isLoading) { // Only save after initial load is complete
      AsyncStorage.setItem(STORAGE_KEY, language);
    }
  }, [language, isLoading]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  // Don't render children until language is loaded
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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