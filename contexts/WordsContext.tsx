import React, { createContext, useContext, useState, ReactNode } from 'react';
import rawWords from '@/data/welsh-words.json';
import { Word } from '@/constants/Types';

const initialWords: Word[] = rawWords.map(word => ({
  ...word,
  stage: 0,
}));

type WordsContextType = {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
};

const WordsContext = createContext<WordsContextType | undefined>(undefined);

export const WordsProvider = ({ children }: { children: ReactNode }) => {
  const [words, setWords] = useState<Word[]>(initialWords);

  return (
    <WordsContext.Provider value={{ words, setWords }}>
      {children}
    </WordsContext.Provider>
  );
};

export const useWords = () => {
  const context = useContext(WordsContext);
  if (!context) {
    throw new Error('useWords must be used within a WordsProvider');
  }
  return context;
};

