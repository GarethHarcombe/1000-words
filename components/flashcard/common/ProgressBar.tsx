// ProgressBar.tsx
import { Word } from '@/constants/Types';
import { View } from '@/components/Themed';
import { StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

type ProgressBarProps = {
    word: Word;
    widthInterpolated: Animated.AnimatedInterpolation<string | number>;
    // New props for completion animation
    // pulseScale?: Animated.Value;
    // pulseOpacity?: Animated.Value;
    // particles?: Array<{
    //   translateX: Animated.Value;
    //   translateY: Animated.Value;
    //   opacity: Animated.Value;
    //   scale: Animated.Value;
    // }>;
};

export default function ProgressBar({
  word, 
  widthInterpolated,
  // pulseScale,
  // pulseOpacity,
  // particles
}: ProgressBarProps) {
    
    return (
      <View style={styles.container}>
        {/* Progress bars */}
        {[0, 1, 2].map((stageIndex) => (
          <Animated.View 
            key={stageIndex}
            style={[
              styles.stageBar,
              word.stage === stageIndex ? 
              { 
                overflow: 'hidden',
              } : {},
              // Apply pulse scale to completed stages
              // word.stage >= 3 && pulseScale ? {
              //   transform: [{ scaleX: pulseScale }, { scaleY: pulseScale }]
              // } : {}
            ]}
          >
            {/* Pulse glow effect for completed stages */}
            {/* {word.streak >= 3 && pulseOpacity && (
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.pulseGlow,
                  { 
                    opacity: pulseOpacity,
                    transform: [{ scale: 1.2 }]
                  }
                ]}
              >
                <LinearGradient
                  colors={[
                    Colors['light']['upperButtonGradient'] + '80',
                    Colors['light']['lowerButtonGradient'] + '80'
                  ]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                />
              </Animated.View>
            )} */}

            {/* Completed stage */}
            {word.stage > stageIndex ? (
              <LinearGradient
                colors={[
                  Colors['light']['upperButtonGradient'], 
                  Colors['light']['lowerButtonGradient']
                ]}
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: 10 }
                ]}
              />

            /* Partial gradient for current stage */
            ) : word.stage === stageIndex ? (
              <Animated.View
                style={[
                  styles.progressGradient,
                  { 
                    width: widthInterpolated, 
                    borderRadius: 10,
                    // Apply pulse scale to current stage
                    // ...(pulseScale ? {
                    //   transform: [{ scaleX: pulseScale }, { scaleY: pulseScale }]
                    // } : {})
                  }
                ]}
              >
                {/* Pulse glow for current stage when completed */}
                {/* {pulseOpacity && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      styles.pulseGlow,
                      { 
                        opacity: pulseOpacity,
                        transform: [{ scale: 1.2 }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        Colors['light']['upperButtonGradient'] + '80',
                        Colors['light']['lowerButtonGradient'] + '80'
                      ]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 15 }]}
                    />
                  </Animated.View>
                )} */}
                
                <LinearGradient
                  colors={[
                    Colors['light']['upperButtonGradient'], 
                    Colors['light']['lowerButtonGradient']
                  ]}
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: 10 }
                  ]}
                />
              </Animated.View>
            ) : null}
          </Animated.View>
        ))}

        {/* Particle system */}
        {/* {particles && particles.map((particle, index) => (
          <Animated.View
            key={`particle-${index}`}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale }
                ],
                opacity: particle.opacity,
              }
            ]}
          />
        ))} */}
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 8,
      // position: 'relative',
    },
    stageBar: {
        height: 15,
        width: 55,
        // flex: 1,
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        position: 'relative',
    },
    progressGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: 10,
    },
    // pulseGlow: {
    //   borderRadius: 15,
    //   shadowColor: Colors['light']['upperButtonGradient'],
    //   shadowOffset: { width: 0, height: 0 },
    //   shadowOpacity: 0.8,
    //   shadowRadius: 8,
    //   elevation: 8,
    // },
    // particle: {
    //   position: 'absolute',
    //   width: 8,
    //   height: 8,
    //   borderRadius: 4,
    //   backgroundColor: Colors['light']['upperButtonGradient'],
    //   top: 7.5, // Center vertically on progress bar
    //   left: '50%', // Start from center
    //   marginLeft: -4, // Account for particle width
    //   shadowColor: Colors['light']['upperButtonGradient'],
    //   shadowOffset: { width: 0, height: 0 },
    //   shadowOpacity: 0.6,
    //   shadowRadius: 3,
    //   elevation: 3,
    // },
});