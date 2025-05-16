import { TouchableOpacity } from '@/components/Themed';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '@/constants/Colors';


type SubmitNextButtonProps = {
  showFeedback: boolean;
  isCorrect: boolean;
  handleNextAfterFeedback: () => void;
  handleConfirmAnswer: () => void
};

export default function SubmitNextButton ({showFeedback, isCorrect, handleNextAfterFeedback, handleConfirmAnswer}: SubmitNextButtonProps) {
    // Get the appropriate gradient colors based on feedback state
    const getGradientColors = () => {
        if (!showFeedback) {
        return [
            Colors['light']['upperButtonGradient'], 
            Colors['light']['lowerButtonGradient']
        ];
        }
        
        if (isCorrect) {
        return [
            Colors['light']['correct'],
            Colors['light']['correct']
        ];
        } else {
        return [
            Colors['light']['incorrect'],
            Colors['light']['incorrect']
        ];
        }
    };

    return (
      <TouchableOpacity
        style={styles.tickButton}
        onPress={showFeedback ? handleNextAfterFeedback : handleConfirmAnswer}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
        >
          <Icon name="chevron-right" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

const styles = StyleSheet.create({
    gradient: {
        width: 69,
        height: 69,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    tickButton: {
        // overflow: 'hidden',
    },
});