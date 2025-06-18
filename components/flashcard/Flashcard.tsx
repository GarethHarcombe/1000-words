// Flashcard.tsx
import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Heading } from '@/components/StyledText';
import { View, Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity as RNTouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { Word } from '@/constants/Types';

// Import custom components
import ProgressBar from './common/ProgressBar';
import StageControls from './common/StageControls';
import InfoButton from './common/InfoButton';
import InfoBottomSheet from './info/InfoBottomSheet';

// Import stage components
import IntroductionStage from './stages/IntroductionStage';
import MultipleChoiceStage from './stages/MultipleChoiceStage';
import RecallStage from './stages/RecallStage';
import MasteredStage from './stages/MasteredStage';

// Import custom hooks
import { useFlashcardState } from './hooks/useFlashcardState';
import { useFlashcardAnimations } from './hooks/useFlashcardAnimations';

type FlashcardProps = {
  word: Word;
  fillerAnswers: string[];
  onCorrectAnswer: () => void;
  onFalseAnswer: () => void;
};

export default function Flashcard({ word, fillerAnswers, onCorrectAnswer, onFalseAnswer }: FlashcardProps) {
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const { 
    widthInterpolated, 
    animateProgressTo, 
    computeFraction,
    // pulseScale,
    // pulseOpacity,
    // particles 
  } = useFlashcardAnimations(word);
  
  const {
    input, setInput,
    selectedOption, setSelectedOption,
    showFeedback, setShowFeedback,
    isCorrect, setIsCorrect,
    shuffledOptions,
    handleConfirmAnswer,
    handleNextAfterFeedback,
    handleKeyPress,
  } = useFlashcardState(word, fillerAnswers, computeFraction, animateProgressTo, onCorrectAnswer, onFalseAnswer);
  
  // Render the appropriate stage component based on word.stage
  const renderStageContent = () => {
    switch (word.stage) {
      case 0:
        return (
          <IntroductionStage 
            word={word}
          />
        );
      case 1:
        return (
          <MultipleChoiceStage
            word={word}
            options={shuffledOptions}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            setIsCorrect={setIsCorrect}
            setShowFeedback={setShowFeedback}
            handleConfirmAnswer={handleConfirmAnswer}
          />
        );
      case 2:
        return (
          <RecallStage
            word={word}
            input={input}
            setInput={setInput}
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            handleKeyPress={handleKeyPress}
            handleConfirmAnswer={handleConfirmAnswer}
            handleNextAfterFeedback={handleNextAfterFeedback}
          />
        );
      case 3:
        return <MasteredStage />;
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.screen}>
      <InfoButton onPress={() => setIsInfoSheetOpen(true)} />
      
      <View style={styles.stageProgressContainer}>
        <ProgressBar 
          word={word}
          widthInterpolated={widthInterpolated}
          // pulseScale={pulseScale}
          // pulseOpacity={pulseOpacity}
          // particles={particles}
        />
      </View>
      
      <Heading style={styles.welshWord}>{word.welsh}</Heading>

      {/* {word.stage === 0 && (
        <Text style={styles.newWordText}>
          New Word! 🎉
        </Text>
      )} */}
      
      <View style={styles.contentBelow}>
        {renderStageContent()}
      </View>

      <StageControls // submit button
        word={word}
        showFeedback={showFeedback}
        isCorrect={isCorrect}
        handleNextAfterFeedback={handleNextAfterFeedback}
        handleConfirmAnswer={handleConfirmAnswer}
      />
      
      <InfoBottomSheet 
        isOpen={isInfoSheetOpen}
        setIsOpen={setIsInfoSheetOpen}
        currentStage={word.stage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  welshWord: {
    position: 'absolute',
    top: '27%', // Increased from percentage to fixed value
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '600',
    zIndex: 10, // Add z-index
    backgroundColor: 'transparent', // Ensure background is transparent
  },
  newWordText: {
    textAlign: 'center',
    top: '40%',
    color: Colors.light.upperButtonGradient,
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 8,
    marginBottom: 4,
    zIndex: 10,
  },
  contentBelow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 180, // Make room for welsh word
  },
  stageProgressContainer: {
    position: 'absolute',
    top: '20%', // Move down to avoid safe area
    left: '10%',
    right: '10%',
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 20, 
  },
});