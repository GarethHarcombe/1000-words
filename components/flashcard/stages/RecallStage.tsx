import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Word } from '@/constants/Types';
import Colors from '@/constants/Colors';
import SubmitNextButton from '../common/SubmitNextButton';
import { useFlashcardAnimations } from '../hooks/useFlashcardAnimations';

type RecallStageProps = {
  word: Word;
  input: string;
  setInput: (input: string) => void;
  showFeedback: boolean;
  isCorrect: boolean;
  handleKeyPress: (e: any) => void;
  handleNextAfterFeedback: () => void;
  handleConfirmAnswer: (option?: string) => void;
};

export default function RecallStage({
  word,
  input,
  setInput,
  showFeedback,
  isCorrect,
  handleKeyPress,
  handleConfirmAnswer,
  handleNextAfterFeedback
}: RecallStageProps) {
  const inputRef = useRef<TextInput>(null);
  const { animateProgressTo, computeFraction } = useFlashcardAnimations(word);
  
  // Focus the input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);
  
  // Animate progress bar when feedback is shown
  useEffect(() => {
    if (showFeedback) {
      const nextStreak = isCorrect ? word.streak + 1 : 0;
      animateProgressTo(computeFraction(nextStreak));
    }
  }, [showFeedback, isCorrect]);
  
  return (
    <View style={styles.optionsContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Enter English word"
          placeholderTextColor="#888" 
          onKeyPress={handleKeyPress}
          editable={!showFeedback}
        />
        {word.stage === 2 && (
          <SubmitNextButton 
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            handleNextAfterFeedback={handleNextAfterFeedback}
            handleConfirmAnswer={handleConfirmAnswer} 
          />
        )}
      </View>
      {showFeedback && !isCorrect && (
        <View style={styles.correctAnswerContainer}>
          <Text style={styles.correctAnswerText}>
            <Text style={styles.correctAnswer}>{word.native}</Text>
          </Text>
        </View>
      )}
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
  inputContainer: {
    width: '80%',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxWidth: 400,
    borderBottomWidth: 1,
    fontSize: 26,
    padding: 8,
    textAlign: 'left',
    marginRight: 10,
  },
  correctAnswerContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f8f8', // Light background
    borderWidth: 1,
    borderColor: Colors.light.incorrect,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#333',
  },
  correctAnswer: {
    fontWeight: 'bold',
    color: Colors.light.incorrect,
  },
});