import { useState, useEffect, useRef } from 'react';
import { TextInput } from 'react-native';
import { Word } from '@/constants/Types';

export function useFlashcardState(
  word: Word, 
  fillerAnswers: string[],
  computeFraction: (streak: number) => number,
  animateProgressTo: (targetFraction: number) => void,
  onCorrectAnswer: () => void, 
  onFalseAnswer: () => void
) {
  const inputRef = useRef<TextInput>(null);
  
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  
  // Reset states when word changes
  useEffect(() => {
    setInput('');
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);

    setShuffledOptions(shuffle([word.english, ...fillerAnswers]));
    
    // Focus the input for stage 2
    if (word.stage === 2 && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [word, fillerAnswers]);

  const handleConfirmAnswer = (option?: string) => {
    switch (word.stage) {
      case 0:
        // For stage 0, just move to next word
        animateProgressTo(1);
        setTimeout(() => {
          onCorrectAnswer();
        }, 600);
        break;
      case 1:
        if (!showFeedback) {
          // For stage 1, immediately show feedback after selection
          const correct = option === word.english;
          setShowFeedback(true);
          
          const nextStreak = correct ? word.streak + 1 : 0;
          animateProgressTo(computeFraction(nextStreak));
        }
        
        break;
      case 2:
        // Check text input
        if (input.trim()) {
          const correct = input.trim().toLowerCase() === word.english.toLowerCase();
          setIsCorrect(correct);
          setShowFeedback(true);

          const nextStreak = correct ? word.streak + 1 : 0;
          animateProgressTo(computeFraction(nextStreak));
        }
        break;
    }
  };

  const handleNextAfterFeedback = () => {
    if (isCorrect) {
      onCorrectAnswer();
    } else {
      onFalseAnswer();
    }
    
    // Reset states for the next word
    setShowFeedback(false);
    setInput('');
    setSelectedOption(null);
  };

  // Handle key press for Enter submission in recall stage
  const handleKeyPress = (e: any) => {
    // Check if it's the Enter/Return key and we're in stage 2
    if (e.key === 'Enter' && word.stage === 2 && !showFeedback) {
      handleConfirmAnswer();
    }
    // For web also support "keypress" event with key code 13 (Enter)
    if (e.nativeEvent && e.nativeEvent.keyCode === 13 && word.stage === 2 && !showFeedback) {
      handleConfirmAnswer();
    }
    // for web advance to next stage if already submitted
    if (e.nativeEvent && e.nativeEvent.keyCode === 13 && word.stage === 2 && showFeedback) {
      handleNextAfterFeedback();
    }
  };

  return {
    input,
    setInput,
    selectedOption,
    setSelectedOption,
    showFeedback,
    setShowFeedback,
    isCorrect,
    setIsCorrect,
    shuffledOptions,
    inputRef,
    handleConfirmAnswer,
    handleNextAfterFeedback,
    handleKeyPress,
  };
}

function shuffle(array: string[]) {
  return [...array].sort(() => 0.5 - Math.random());
}