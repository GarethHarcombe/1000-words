
import { useRef, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { Word } from '@/constants/Types';

export function useFlashcardAnimations(word?: Word) {
  const computeFraction = (streak: number) => 0.1 + 0.9 * (streak / 3);

  const streak = word?.streak ?? 0;
  const wordIndex = word?.index ?? 0;

  const progressRef = useRef<Animated.Value | null>(null);

  if (!progressRef.current) {
    progressRef.current = new Animated.Value(computeFraction(streak));
  }

  const progress = progressRef.current;

  useEffect(() => {
    const newFraction = computeFraction(word?.streak ?? 0);
    progress.stopAnimation();
    progress.setValue(newFraction);
  }, [wordIndex]); // re-run when the displayed word changes

  const widthInterpolated = useMemo(() => {
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
  }, [progress]);

  const animateProgressTo = (targetFraction: number) => {
    progress.stopAnimation();
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
    computeFraction,
  };
}
