// useFlashcardAnimations.tsx
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Word } from '@/constants/Types';

export function useFlashcardAnimations(word: Word) {
  // Helper to compute fraction 0–1 from streak 0–3
  const computeFraction = (streak: number) => 0.1 + 0.9 * (streak / 3);

  // Use a ref to hold the Animated.Value across renders
  const initialFraction = computeFraction(word.streak);
  const progress = useRef(new Animated.Value(initialFraction)).current;  // ← holds 0–1

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Reset progress animation when word changes
  useEffect(() => {
    progress.setValue(computeFraction(word.streak));
  }, [word]);

  const animateProgressTo = (targetFraction: number) => {
    Animated.timing(progress, {
      toValue: targetFraction,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  return {
    progress,
    widthInterpolated,
    animateProgressTo,
    computeFraction
  };
}