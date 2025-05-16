import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '@/components/Themed';
import { Word } from '@/constants/Types';
import Colors from '@/constants/Colors';
import { useFlashcardAnimations } from '../hooks/useFlashcardAnimations';

type MultipleChoiceStageProps = {
  word: Word;
  options: string[];
  selectedOption: string | null;
  setSelectedOption: (option: string) => void;
  showFeedback: boolean;
  isCorrect: boolean;
  setIsCorrect: (isCorrect: boolean) => void;
  setShowFeedback: (showFeedback: boolean) => void;
  handleConfirmAnswer: (option?: string) => void;
};

export default function MultipleChoiceStage({
  word,
  options,
  selectedOption,
  setSelectedOption,
  showFeedback,
  isCorrect,
  setIsCorrect,
  setShowFeedback,
  handleConfirmAnswer,
}: MultipleChoiceStageProps) {
  const { animateProgressTo, computeFraction } = useFlashcardAnimations(word);
  
  return (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionCard,
            showFeedback && selectedOption === option && option !== word.english && styles.incorrectOption,
            showFeedback && option === word.english && styles.correctOption  // e.g. if correct
          ]}
          onPress={() => {
            const correct = option === word.english;
            setIsCorrect(correct);
            setSelectedOption(option);
            handleConfirmAnswer(option);
          }}
          disabled={showFeedback}
        >
          <Text style={styles.cardText}>{option}</Text>
          {showFeedback && option === word.english && (
            <Text style={styles.checkMark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    marginTop: 20,
    gap: 20,
    width: '100%',
    alignItems: 'center',
  },
  optionCard: {
    height: 56,
    borderRadius: 28,
    width: '80%',
    maxWidth: 350,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,

    // Android shadow
    elevation: 4,
  },
  cardText: {
    fontSize: 27,
    fontWeight: '400',
  },
  correctOption: {
    backgroundColor: Colors.light.correct, // Green
  },
  incorrectOption: {
    borderWidth: 4,
    borderColor: Colors.light.incorrect,
  },
  checkMark: {
    position: 'absolute',
    right: 15,
    fontSize: 20,
    color: '#ffffff',
  },
});