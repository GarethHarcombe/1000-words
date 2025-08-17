import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import Flashcard from '@/components/flashcard/Flashcard';
import { Word } from '@/constants/Types';
import wordsByGroup from '@/data/grouped_welsh_words.json'; // converted JSON
import ExitButton from '@/components/flashcard/common/ExitButton';

export default function TownFlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Convert JSON words into Word[] type
  const groupKey = (id as keyof typeof wordsByGroup) || "1";

  const initialWords: Word[] = wordsByGroup[groupKey].map((w, index) => ({
    index,
    welsh: w.welsh,
    english: w.english,
    stage: 0,
    streak: 0,
    numCorrect: 0,
  }));


  const [words, setWords] = useState(initialWords);
  const [index, setIndex] = useState(0);

  const nextWord = () => setIndex((prev) => (prev + 1) % words.length);

  const advanceStage = () => {
    const updated = [...words];
    if (updated[index].stage < 3) updated[index].stage += 1;
    setWords(updated);
  };

  
  const fillerAnswers = words
    .filter((_, i) => i !== index)
    .map((w) => w.english)
    .slice(0, 3);


  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ExitButton onPress={() => router.back()} />

      <Flashcard
        word={words[index]}
        fillerAnswers={fillerAnswers}
        onCorrectAnswer={() => {
          words[index].streak += 1;
          if (words[index].stage === 0 || words[index].streak === 3) {
            advanceStage();
            words[index].streak = 0;
          }
          nextWord();
        }}
        onFalseAnswer={() => {
          words[index].streak = 0;
          nextWord();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
