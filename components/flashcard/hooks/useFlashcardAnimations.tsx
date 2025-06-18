// useFlashcardAnimations.tsx
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Word } from '@/constants/Types';

export function useFlashcardAnimations(word: Word) {
  // Helper to compute fraction 0–1 from streak 0–3
  const computeFraction = (streak: number) => 0.1 + 0.9 * (streak / 3);

  // Create a fresh animated value for each word change to avoid driver conflicts
  const progressRef = useRef<Animated.Value | null>(null);
  const initialFraction = computeFraction(word.streak);
  
  // Initialize or recreate progress value
  if (!progressRef.current) {
    progressRef.current = new Animated.Value(initialFraction);
  }
  
  const progress = progressRef.current;
  
  // Animation values for completion celebration
  // const pulseScale = useRef(new Animated.Value(1)).current;
  // const pulseOpacity = useRef(new Animated.Value(0)).current;
  
  // Create particle animations (8 particles)
  // const particles = useRef(
  //   Array.from({ length: 8 }, () => ({
  //     translateX: new Animated.Value(0),
  //     translateY: new Animated.Value(0),
  //     opacity: new Animated.Value(0),
  //     scale: new Animated.Value(0),
  //   }))
  // ).current;

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Reset progress animation when word changes
  useEffect(() => {
    const newFraction = computeFraction(word.streak);
    
    // Create a completely new animated value to avoid driver conflicts
    progressRef.current = new Animated.Value(newFraction);
    
    // Reset completion animations
    // pulseScale.setValue(1);
    // pulseOpacity.setValue(0);
    // particles.forEach(particle => {
    //   particle.translateX.setValue(0);
    //   particle.translateY.setValue(0);
    //   particle.opacity.setValue(0);
    //   particle.scale.setValue(0);
    // });
  }, [word.index]); // Use word.id instead of entire word object

  const animateProgressTo = (targetFraction: number) => {
    if (!progressRef.current) return;
    
    // Stop any existing animations first
    progressRef.current.stopAnimation();
    
    Animated.timing(progressRef.current, {
      toValue: targetFraction,
      duration: 300,
      useNativeDriver: false, // Required for width animations
    }).start(() => {
      // Trigger completion animation if we've reached the target
      // if (targetFraction >= 0.9) {
      //   triggerCompletionAnimation();
      // }
    });
  };

  // const triggerCompletionAnimation = () => {
    // Reset all particle animations first
    // particles.forEach(particle => {
    //   particle.translateX.stopAnimation();
    //   particle.translateY.stopAnimation();
    //   particle.opacity.stopAnimation();
    //   particle.scale.stopAnimation();
      
    //   // Reset to initial state
    //   particle.translateX.setValue(0);
    //   particle.translateY.setValue(0);
    //   particle.opacity.setValue(0);
    //   particle.scale.setValue(0);
    // });
    
    // // Reset pulse animations
    // pulseScale.stopAnimation();
    // pulseOpacity.stopAnimation();
    // pulseScale.setValue(1);
    // pulseOpacity.setValue(0);

    // // Particle burst animation
    // const particleAnimations = particles.map((particle, index) => {
    //   // Random direction and distance for each particle
    //   const angle = (index / particles.length) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    //   const distance = 40 + Math.random() * 30; // 40-70px distance
    //   const targetX = Math.cos(angle) * distance;
    //   const targetY = Math.sin(angle) * distance;

    //   return Animated.sequence([
    //     // Start particles at center, make them visible
    //     Animated.parallel([
    //       Animated.timing(particle.opacity, {
    //         toValue: 1,
    //         duration: 0,
    //         useNativeDriver: true,
    //       }),
    //       Animated.timing(particle.scale, {
    //         toValue: 1,
    //         duration: 0,
    //         useNativeDriver: true,
    //       }),
    //     ]),
    //     // Animate particles outward
    //     Animated.parallel([
    //       Animated.timing(particle.translateX, {
    //         toValue: targetX,
    //         duration: 600,
    //         useNativeDriver: true,
    //       }),
    //       Animated.timing(particle.translateY, {
    //         toValue: targetY + 30, // Add gravity effect
    //         duration: 600,
    //         useNativeDriver: true,
    //       }),
    //       // Fade out particles
    //       Animated.timing(particle.opacity, {
    //         toValue: 0,
    //         duration: 600,
    //         useNativeDriver: true,
    //       }),
    //       // Shrink particles as they fade
    //       Animated.timing(particle.scale, {
    //         toValue: 0.3,
    //         duration: 600,
    //         useNativeDriver: true,
    //       }),
    //     ]),
    //   ]);
    // });

    // // Pulse animation (starts 100ms after particles)
    // const pulseAnimation = Animated.sequence([
    //   Animated.delay(100),
    //   // Fade in glow
    //   Animated.timing(pulseOpacity, {
    //     toValue: 0.6,
    //     duration: 200,
    //     useNativeDriver: true,
    //   }),
    //   // Scale up with bounce
    //   Animated.spring(pulseScale, {
    //     toValue: 1.1,
    //     tension: 300,
    //     friction: 6,
    //     useNativeDriver: true,
    //   }),
    //   // Scale back down
    //   Animated.spring(pulseScale, {
    //     toValue: 1,
    //     tension: 300,
    //     friction: 6,
    //     useNativeDriver: true,
    //   }),
    //   // Fade out glow
    //   Animated.timing(pulseOpacity, {
    //     toValue: 0,
    //     duration: 300,
    //     useNativeDriver: true,
    //   }),
    // ]);

  //   // Run all animations simultaneously
  //   Animated.parallel([
  //     ...particleAnimations,
  //     pulseAnimation,
  //   ]).start();
  // };

  return {
    progress: progressRef.current!,
    widthInterpolated,
    animateProgressTo,
    computeFraction,
    // Completion animation values
    // pulseScale,
    // pulseOpacity,
    // particles,
  };
}