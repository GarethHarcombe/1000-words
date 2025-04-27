import React, { createContext, useContext, useState, ReactNode } from 'react';
import rawWords from '@/data/welsh-words.json';
import { Word } from '@/constants/Types';

const initialWords: Word[] = rawWords.map(word => ({
  ...word,
  numCorrect: 0,
  stage: 0,
}));

type UserContextType = {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [words, setWords] = useState<Word[]>(initialWords);

  return (
    <UserContext.Provider value={{ words, setWords }}>
      {children}
    </UserContext.Provider>
  );
};

export const useWords = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useWords must be used within a UserProvider');
  }
  return context;
};

