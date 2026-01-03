
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';

import { Word } from '@/constants/Types';
import { useUserContext, Language } from '@/contexts/UserContext';

import welshWordsByGroup from '@/data/grouped_welsh_words.json';
import spanishWordsByGroup from '@/data/grouped_spanish_words.json';
import maoriWordsByGroup from '@/data/grouped_maori_words.json';

type WordGroupRow = Omit<Word, 'numCorrect' | 'streak' | 'stage' >;

const WORD_DATASETS: Record<Language, WordGroupRow[]> = {
  welsh: welshWordsByGroup as WordGroupRow[],
  spanish: spanishWordsByGroup as WordGroupRow[],
  maori: maoriWordsByGroup as WordGroupRow[],
};

type WordProgress = Pick<Word, 'numCorrect' | 'streak' | 'stage' >;

type StoredProgressV1 = {
  version: 1;
  updatedAt: number;
  items: Record<string, WordProgress>;
};

const STORAGE_KEY = (language: Language) => `wordsProgress:${language}`;


type WordRow = {
  foreign: string;
  native: string;
  group: string;
  index: number;
};



const getWordKey = (w: Partial<WordRow>) => {
  // Best option if index is stable across builds
  if (typeof w.index === 'number') return String(w.index);

  // Fallback if index is missing or not reliable
  if (w.foreign && w.native && w.group) return `${w.foreign}|${w.native}|${w.group}`;

  // Last resort
  return JSON.stringify(w);
};


const buildInitialWords = (rows: WordGroupRow[]): Word[] =>
  rows.map((word) => ({
    ...(word as Word),
    numCorrect: 0,
    streak: 0,
    stage: 0,
  }));


const clearProgress = (language: Language) => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`wordsProgress:${language}`);
};


const loadProgressMerged = (language: Language, base: Word[]): Word[] => {
  if (typeof window === 'undefined') return base;

  const raw = window.localStorage.getItem(STORAGE_KEY(language));
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw) as StoredProgressV1;
    if (!parsed || parsed.version !== 1 || !parsed.items) return base;

    return base.map((w) => {
      const key = getWordKey(w);
      const progress = parsed.items[key];
      return progress
        ? { ...w, ...progress }
        : w;
    });
  } catch {
    // If storage is corrupted, ignore and use base.
    return base;
  }
};

const saveProgress = (language: Language, words: Word[]) => {
  if (typeof window === 'undefined') return;

  const items: Record<string, WordProgress> = {};
  for (const w of words) {
    const key = getWordKey(w);
    items[key] = {
      numCorrect: w.numCorrect,
      streak: w.streak,
      stage: w.stage,
    };
  }

  const payload: StoredProgressV1 = {
    version: 1,
    updatedAt: Date.now(),
    items,
  };

  window.localStorage.setItem(STORAGE_KEY(language), JSON.stringify(payload));
};

type WordContextType = {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
};

const WordContext = createContext<WordContextType | undefined>(undefined);

export const WordProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useUserContext();

  const baseWordsForLanguage = useMemo(() => {
    const dataset = WORD_DATASETS[language] ?? [];
    return buildInitialWords(dataset);
  }, [language]);

  // Load the correct language words + merge progress once per language change
  const [words, setWords] = useState<Word[]>(() =>
    loadProgressMerged(language, baseWordsForLanguage),
  );

  // When language changes, switch the list and restore that language's progress
  useEffect(() => {
    const merged = loadProgressMerged(language, baseWordsForLanguage);
    setWords(merged);
  }, [language, baseWordsForLanguage]);

  // Avoid writing immediately after we just loaded language data
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    hasLoadedRef.current = true;
    return () => {
      hasLoadedRef.current = false;
    };
  }, [language]);

  // Persist progress for this language whenever words change
  // Debounced to reduce write frequency.
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const handle = window.setTimeout(() => {
      saveProgress(language, words);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [language, words]);

  return (
    <WordContext.Provider value={{ words, setWords }}>
      {children}
    </WordContext.Provider>
  );
};

export const useWords = () => {
  const context = useContext(WordContext);
  if (!context) {
    throw new Error('useWords must be used within a WordProvider');
  }
  return context;
};
