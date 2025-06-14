// useFlashcardAnimations.tsx
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Word } from '@/constants/Types';

export function useFlashcardAnimations(word: Word) {
  // Helper to compute fraction 0–1 from streak 0–3
  const computeFraction = (streak: number) => 0.1 + 0.9 * (streak / 3);

  // Use a ref to hold the Animated.Value across renders
  const initialFraction = computeFraction(word.streak);
  const progress = useRef(new Animated.Value(initialFraction)).current;
  
  // Animation values for completion celebration
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  
  // Create particle animations (8 particles)
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Reset progress animation when word changes
  useEffect(() => {
    const newFraction = computeFraction(word.streak);
    progress.setValue(newFraction);
    
    // Reset completion animations
    pulseScale.setValue(1);
    pulseOpacity.setValue(0);
    particles.forEach(particle => {
      particle.translateX.setValue(0);
      particle.translateY.setValue(0);
      particle.opacity.setValue(0);
      particle.scale.setValue(0);
    });
  }, [word]);

  const animateProgressTo = (targetFraction: number) => {
    Animated.timing(progress, {
      toValue: targetFraction,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Trigger completion animation if we've reached 100%
      if (targetFraction >= 0.9) {
        triggerCompletionAnimation();
      }
    });
  };

  const triggerCompletionAnimation = () => {
    // Particle burst animation
    const particleAnimations = particles.map((particle, index) => {
      // Random direction and distance for each particle
      const angle = (index / particles.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const distance = 40 + Math.random() * 30; // 40-70px distance
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      return Animated.sequence([
        // Start particles at center, make them visible
        Animated.timing(particle.opacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
        // Animate particles outward
        Animated.parallel([
          Animated.timing(particle.translateX, {
            toValue: targetX,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: targetY + 30, // Add gravity effect
            duration: 600,
            useNativeDriver: true,
          }),
          // Fade out particles
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          // Shrink particles as they fade
          Animated.timing(particle.scale, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // Pulse animation (starts 100ms after particles)
    const pulseAnimation = Animated.sequence([
      Animated.delay(100),
      // Fade in glow
      Animated.timing(pulseOpacity, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
      // Scale up with bounce
      Animated.spring(pulseScale, {
        toValue: 1.1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
      // Scale back down
      Animated.spring(pulseScale, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }),
      // Fade out glow
      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    // Run all animations simultaneously
    Animated.parallel([
      ...particleAnimations,
      pulseAnimation,
    ]).start();
  };

  return {
    progress,
    widthInterpolated,
    animateProgressTo,
    computeFraction,
    // Completion animation values
    pulseScale,
    pulseOpacity,
    particles,
  };
}