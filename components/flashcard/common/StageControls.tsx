import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Word } from '@/constants/Types';
import SubmitNextButton from './SubmitNextButton';

type StageControlsProps = {
  word: Word;
  showFeedback: boolean;
  isCorrect: boolean;
  handleNextAfterFeedback: () => void;
  handleConfirmAnswer: () => void;
};

export default function StageControls({
  word,
  showFeedback,
  isCorrect,
  handleNextAfterFeedback,
  handleConfirmAnswer
}: StageControlsProps) {
  
  // Only show controls for stage 0, or stage 1 with feedback, or at bottom of screen
  if (word.stage !== 0 && !(word.stage === 1 && showFeedback)) {
    return null;
  }
  
  return (
    <View style={styles.nextButtonContainer}>
      <SubmitNextButton 
        showFeedback={showFeedback}
        isCorrect={isCorrect}
        handleNextAfterFeedback={handleNextAfterFeedback}
        handleConfirmAnswer={handleConfirmAnswer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nextButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
});