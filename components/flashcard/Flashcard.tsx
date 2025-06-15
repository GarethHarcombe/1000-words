// Flashcard.tsx
import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { Heading } from '@/components/StyledText';
import { View } from '@/components/Themed';
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
    pulseScale,
    pulseOpacity,
    particles 
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
      
      <RNView style={styles.stageProgressContainer}>
        <ProgressBar 
          word={word}
          widthInterpolated={widthInterpolated}
          pulseScale={pulseScale}
          pulseOpacity={pulseOpacity}
          particles={particles}
        />
      </RNView>
      
      <Heading style={styles.welshWord}>{word.welsh}</Heading>
      
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
    position: 'relative',
    height: '100%',
  },
  welshWord: {
    top: '25%',
    width: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '600',
  },
  contentBelow: {
    marginTop: 200,
    alignItems: 'center',
    width: '100%',
  },
  stageProgressContainer: {
    position: 'absolute',
    top: '20%',
    maxWidth: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
  },
});