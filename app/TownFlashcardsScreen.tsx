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

  const nextWord = () =>
    setIndex((prev) => (prev + 1) % groupWords.length);

  const advanceStage = () => {
    const updated = [...words];
    const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh);
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
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh);
          words[globalIndex].streak += 1;

          if (
            words[globalIndex].stage === 0 ||
            words[globalIndex].streak === 3
          ) {
            advanceStage();
            words[globalIndex].streak = 0;
          }
          nextWord();
        }}
        onFalseAnswer={() => {
          const globalIndex = words.findIndex(w => w.welsh === groupWords[index].welsh);
          words[globalIndex].streak = 0;
          nextWord();
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
