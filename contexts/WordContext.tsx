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

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Word } from '@/constants/Types';
import { useUserContext, Language } from '@/contexts/UserContext';

import welshWordsByGroup from '@/data/grouped_welsh_words.json';
import spanishWordsByGroup from '@/data/grouped_spanish_words.json';
import maoriWordsByGroup from '@/data/grouped_maori_words.json';

/* -------------------- Types -------------------- */

type WordGroupRow = Omit<Word, 'numCorrect' | 'streak' | 'stage'>;

const WORD_DATASETS: Record<Language, WordGroupRow[]> = {
  welsh: welshWordsByGroup as WordGroupRow[],
  spanish: spanishWordsByGroup as WordGroupRow[],
  maori: maoriWordsByGroup as WordGroupRow[],
};

type WordProgress = Pick<Word, 'numCorrect' | 'streak' | 'stage'>;

type StoredProgressV1 = {
  version: 1;
  updatedAt: number;
  items: Record<string, WordProgress>;
};

const STORAGE_KEY = (language: Language) => `wordsProgress:${language}`;

/* -------------------- Helpers -------------------- */

type WordRow = {
  foreign: string;
  native: string;
  group: string;
  index: number;
};

const getWordKey = (w: Partial<WordRow>) => {
  if (typeof w.index === 'number') return String(w.index);
  if (w.foreign && w.native && w.group)
    return `${w.foreign}|${w.native}|${w.group}`;
  return JSON.stringify(w);
};

const buildInitialWords = (rows: WordGroupRow[]): Word[] =>
  rows.map((word) => ({
    ...(word as Word),
    numCorrect: 0,
    streak: 0,
    stage: 0,
  }));

const loadProgressMerged = async (
  language: Language,
  base: Word[],
): Promise<Word[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY(language));
  if (!raw) return base;

  try {
    const parsed = JSON.parse(raw) as StoredProgressV1;
    if (!parsed || parsed.version !== 1 || !parsed.items) return base;

    return base.map((w) => {
      const key = getWordKey(w);
      const progress = parsed.items[key];
      return progress ? { ...w, ...progress } : w;
    });
  } catch {
    return base;
  }
};

const saveProgress = async (language: Language, words: Word[]) => {
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

  await AsyncStorage.setItem(
    STORAGE_KEY(language),
    JSON.stringify(payload),
  );
};

/* -------------------- Context -------------------- */

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

  const [words, setWords] = useState<Word[]>([]);
  const hasLoadedRef = useRef(false);

  // Load words + progress when language changes
  useEffect(() => {
    let cancelled = false;
    hasLoadedRef.current = false;

    (async () => {
      const merged = await loadProgressMerged(
        language,
        baseWordsForLanguage,
      );

      if (!cancelled) {
        setWords(merged);
        hasLoadedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, baseWordsForLanguage]);

  // Persist progress (debounced)
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const handle = setTimeout(() => {
      saveProgress(language, words);
    }, 250);

    return () => clearTimeout(handle);
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
