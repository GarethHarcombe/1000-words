// ProgressBar.tsx
import { Word } from '@/constants/Types';
import { View } from '@/components/Themed';
import { StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';


type ProgressBarProps = {
    word: Word;
    widthInterpolated: Animated.AnimatedInterpolation<string | number>;
};

export default function ProgressBar ({word, widthInterpolated }: ProgressBarProps) {
    
    return ([0, 1, 2].map((stageIndex) => (
        // default grey stage bar; overwrite with progress bars below
        <View 
        key={stageIndex}
        style={[
            styles.stageBar,
            word.stage === stageIndex ? 
            { 
                // backgroundColor: 'transparent',
                overflow: 'hidden',
            } : {}
        ]}
        >

        {/* completed stage */}
        {word.stage > stageIndex ? (
            // For completed stages, use a full-width gradient view
            <LinearGradient
            colors={[
                Colors['light']['upperButtonGradient'], 
                Colors['light']['lowerButtonGradient']
            ]}
            style={[
                StyleSheet.absoluteFill,
                { borderRadius: 10 } // Ensure the gradient respects rounded corners
            ]}
            />

        // partial gradient for current stage
        ) : word.stage === stageIndex ? (
            <Animated.View
            style={[
                styles.progressGradient,
                { width: widthInterpolated, borderRadius: 10 }
            ]}>
            <LinearGradient
                colors={[
                Colors['light']['upperButtonGradient'], 
                Colors['light']['lowerButtonGradient']
                ]}
                style={[
                StyleSheet.absoluteFill,
                { borderRadius: 10 } // Ensure the gradient respects rounded corners
                ]}
            />
            </Animated.View>
        ) : null}
        </View>
    )))
};

const styles = StyleSheet.create({
    stageBar: {
        height: 15,
        width: 55,
        flex: 1,
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
    }
});