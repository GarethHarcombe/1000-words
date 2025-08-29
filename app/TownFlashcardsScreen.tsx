import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Flashcard from '@/components/flashcard/Flashcard';
import { Word } from '@/constants/Types';
import ExitButton from '@/components/flashcard/common/ExitButton';
import { useWords } from '@/contexts/UserContext';


export default function TownFlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { words, setWords } = useWords();

  // Subset: only words belonging to this group
  const groupKey = id || "1";
  const groupWords = words.filter((w) => String(w.group) === groupKey);

  const [index, setIndex] = useState(0);

  const intervals = [10 * 1000, 30 * 1000, 60 * 1000, 20 * 60 * 1000]; // ms

  const scheduleNextReview = (word: Word, correct: boolean) => {
    const now = Date.now();
    if (correct) {
      if (word.stage < 1 || (word.stage < 3 && word.streak >= 3)) {
        word.stage += 1;
        word.streak = 0;
      }
      word.nextReview = now + intervals[word.stage];
    } else {
      word.streak = 0;
      word.nextReview = now + 60 * 1000; // 1 min for wrong answer
    }
  };

  const nextWord = () => {
    const now = Date.now();
    const dueWords = groupWords.filter(w => !w.nextReview || w.nextReview <= now);
    if (dueWords.length > 0) {
      const nextIndex = groupWords.findIndex(w => w.welsh === dueWords[0].welsh);
      setIndex(nextIndex);
    } else {
      // If none are due, pick the one with the earliest nextReview
      const nextIndex = groupWords.reduce((earliestIdx, w, i) =>
        !groupWords[earliestIdx].nextReview || (w.nextReview || Infinity) < (groupWords[earliestIdx].nextReview || Infinity)
          ? i
          : earliestIdx,
        0
      );
      setIndex(nextIndex);
    }
  };


  const advanceStage = () => {
    const updated = [...words];
    const globalIndex = words.findIndex(w => (w.welsh === groupWords[index].welsh && w.group === groupWords[index].group));
    if (updated[globalIndex].stage < 3) updated[globalIndex].stage += 1;
    setWords(updated);
  };

  const fillerAnswers = groupWords
    .filter((_, i) => i !== index)
    .map((w) => w.english)
    .slice(0, 3);

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
        fillerAnswers={fillerAnswers}
        onCorrectAnswer={() => {
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh && w.group === groupWords[index].group);
          words[globalIndex].streak += 1;
          scheduleNextReview(words[globalIndex], true);
          setWords([...words]);
          nextWord();
        }}

        onFalseAnswer={() => {
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh && w.group === groupWords[index].group);
          scheduleNextReview(words[globalIndex], false);
          setWords([...words]);
          nextWord();
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
