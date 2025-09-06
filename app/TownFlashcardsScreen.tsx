import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Flashcard from '@/components/flashcard/Flashcard';
import { Word } from '@/constants/Types';
import ExitButton from '@/components/flashcard/common/ExitButton';
import { useWords } from '@/contexts/UserContext';

// ---------------------
// Spaced repetition helpers
// ---------------------

const WRONG_INTERVAL_MS = 10_000; // 10 seconds for wrong answers
const SOONEST_POOL_SIZE = 3;

function getIntervalMs(stage: number, streak: number): number {
  if (stage === 0) return 1_000;
  if (stage === 1) {
    if (streak === 0) return 3_000;
    if (streak === 1) return 6_000;
    if (streak === 2) return 10_000;
  }
  if (stage === 2) {
    if (streak === 0) return 60_000;
    if (streak === 1) return 120_000;
    if (streak === 2) return 240_000;
  }
  return 0;
}

function buildPool(words: Word[]): Word[] {
  return words.filter(w => (w.stage ?? 0) < 2);
}

function getDuePool(pool: Word[], now: number): Word[] {
  return pool.filter(w => (w.nextDue ?? 0) <= now);
}

function pickNextIndex(groupWords: Word[], currentIndex: number, now: number): number {
  const pool = buildPool(groupWords);

  const due = getDuePool(pool, now);

  // Helper to pick randomly avoiding current when possible
  const pickRandomIndexFromSet = (candidates: Word[]): number => {
    // Map candidates back to groupWords indices
    const candidateIndices = candidates
      .map(w =>
        groupWords.findIndex(
          gw => gw.welsh === w.welsh && gw.group === w.group
        )
      )
      .filter(i => i >= 0);

    if (candidateIndices.length === 0) return 0;

    if (currentIndex != null && candidateIndices.length > 1) {
      const withoutCurrent = candidateIndices.filter(i => i !== currentIndex);
      const poolToUse = withoutCurrent.length > 0 ? withoutCurrent : candidateIndices;
      return poolToUse[Math.floor(Math.random() * poolToUse.length)];
    }

    return candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
  };

  if (due.length > 0) {
    return pickRandomIndexFromSet(due);
  }

  // None due: pick from soonest N
  const soonest = [...pool]
    .filter(w => w.stage === 0 )
    // .slice(0, Math.min(SOONEST_POOL_SIZE, pool.length));

  return pickRandomIndexFromSet(soonest);

}

// ---------------------
// Component
// ---------------------

export default function TownFlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { words, setWords } = useWords();

  const groupKey = id || '1';
  const groupWords = words.filter(w => String(w.group) === groupKey);

  const [index, setIndex] = useState(0);

  // Seed nextDue for this group
  useEffect(() => {
    const updated = words.map(w => {
      if (String(w.group) === groupKey && (w.stage ?? 0) < 2 && (w.nextDue == null || !isFinite(w.nextDue))) {
        return { ...w, nextDue: Infinity, lastSeen: 0 };
      }
      return w;
    });
    setWords(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupKey]);

  const nextWord = () => {
    const now = Date.now();
    const next = pickNextIndex(groupWords, index, now);
    setIndex(next);
  };

  function shuffle<T>(array: T[]): T[] {
    return [...array].sort(() => 0.5 - Math.random());
  }

  function getFillerAnswers(words: Word[], selectedWord: Word): string[] {
    const candidates = words.filter(w => w.welsh !== selectedWord.welsh);

    const shuffled = shuffle(candidates.map(w => w.english));

    // Take 3 random fillers from the shuffled list
    return shuffled.slice(0, 3);
  }

  if (groupWords.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ExitButton onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ExitButton onPress={() => router.back()} />

      <Flashcard
        word={groupWords[index]}
        fillerAnswers={getFillerAnswers(groupWords, groupWords[index])}
        onCorrectAnswer={() => {
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh);
          const updated = [...words];
          const now = Date.now();

          // Stage & streak logic
          updated[globalIndex].streak = (updated[globalIndex].streak ?? 0) + 1;

          if (updated[globalIndex].stage === 0 && updated[globalIndex].streak >= 1) {
            updated[globalIndex].stage = 1;
            updated[globalIndex].streak = 0;
          } else if (updated[globalIndex].stage === 1 && updated[globalIndex].streak > 2) {
            updated[globalIndex].stage = 2;
            updated[globalIndex].streak = 0;
          }

          // Schedule nextDue
          if (updated[globalIndex].stage >= 2) {
            updated[globalIndex].nextDue = now + 3//Number.POSITIVE_INFINITY;
          } else {
            updated[globalIndex].nextDue = now + getIntervalMs(updated[globalIndex].stage, updated[globalIndex].streak);
          }
          updated[globalIndex].lastSeen = now;

          setWords(updated);
          nextWord();
        }}
        onFalseAnswer={() => {
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh);
          const updated = [...words];
          const now = Date.now();

          // Reset streak (no demotion unless you want it)
          updated[globalIndex].streak = 0;

          // Schedule nextDue for wrong answer
          updated[globalIndex].nextDue = now + WRONG_INTERVAL_MS;
          updated[globalIndex].lastSeen = now;

          setWords(updated);
          nextWord();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});