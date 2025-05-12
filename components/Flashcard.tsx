import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Word } from '../constants/Types';
import { Text, View, TouchableOpacity } from './Themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading } from '@/components/StyledText';
import Colors from '@/constants/Colors';
import { Animated } from 'react-native';
import SubmitNextButton from './flashCardComponents/SubmitNextButton';
import ProgressBar from './flashCardComponents/ProgressBar';


type FlashcardProps = {
  word: Word;
  fillerAnswers: string[];
  onCorrectAnswer: () => void;
  onFalseAnswer: () => void;
};

export default function Flashcard({ word, fillerAnswers, onCorrectAnswer, onFalseAnswer }: FlashcardProps) {
  const inputRef = React.useRef<TextInput>(null);
  
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // Helper to compute fraction 0–1 from streak 0–3
  const computeFraction = (streak: number) => 0.1 + 0.9 * (streak / 3);

  // Use a ref to hold the Animated.Value across renders
  const initialFraction = computeFraction(word.streak);
  const progress = useRef(new Animated.Value(initialFraction)).current;  // ← holds 0–1

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const animateProgressTo = (targetFraction: number) => {
    Animated.timing(progress, {
      toValue: targetFraction,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Reset states when word changes
  useEffect(() => {
    setInput('');
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);

    setShuffledOptions(shuffle([word.english, ...fillerAnswers]));
    
    // Reset progress animation to current streak value
    progress.setValue(computeFraction(word.streak));
    
    // Focus the input for stage 2
    if (word.stage === 2 && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [word, fillerAnswers]);

  const handleConfirmAnswer = () => {
    switch (word.stage) {
      case 0:
        // For stage 0, animate to next streak and wait for animation to complete
        const nextStreak0 = word.streak + 3;

        Animated.timing(progress, {
          toValue: computeFraction(nextStreak0),
          duration: 300,
          useNativeDriver: false,
        }).start(({ finished }) => {
          // Only proceed when animation is finished
          if (finished) {
            setTimeout(() => {
              onCorrectAnswer();
            }, 300);
          }
        });
        break;
      case 1:
          setShowFeedback(true);

          // animate to next fraction (or reset if wrong)
          const nextStreak = isCorrect ? word.streak + 1 : 0;
          animateProgressTo(computeFraction(nextStreak));
        break;
      case 2:
        // Check text input
        if (input.trim()) {
          const correct = input.trim().toLowerCase() === word.english.toLowerCase();
          setIsCorrect(correct);
          setShowFeedback(true);

          // animate bar
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

  // Handle key press for Enter submission
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

  const renderStageContent = () => {
    switch (word.stage) {
      case 0:
        return (
          <View style={styles.cardContainer}>
            <Text style={styles.cardText}>{word.english}</Text>
          </View>
        );
      case 1:
        return (
          <View style={styles.optionsContainer}>
            {shuffledOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionCard,
                  showFeedback && selectedOption === option && !isCorrect && styles.incorrectOption,
                  showFeedback && option === word.english && styles.correctOption  // e.g. if correct
                ]}
                onPress={() => {
                  if (!showFeedback) {
                    setSelectedOption(option);
                    // For stage 1, immediately show feedback after selection
                    const correct = option === word.english;
                    setIsCorrect(correct);
                    setShowFeedback(true);
                    
                    // Add animation here - this was missing
                    const nextStreak = correct ? word.streak + 1 : 0;
                    animateProgressTo(computeFraction(nextStreak));
                  }
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
      case 2:
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
                onSubmitEditing={handleConfirmAnswer} // This handles Enter/Return on mobile
                editable={!showFeedback}
              />
              <SubmitNextButton 
                showFeedback={showFeedback}
                isCorrect={isCorrect}
                handleNextAfterFeedback={handleNextAfterFeedback}
                handleConfirmAnswer={handleNextAfterFeedback}
              />
            </View>
            {showFeedback && !isCorrect && (
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>
                  <Text style={styles.correctAnswer}>{word.english}</Text>
                </Text>
              </View>
            )}
          </View>
        );
      case 3: // what to do if all words are mastered - not likely to be shown 
        return (
          <View>
            <Text style={styles.mastered}>All Words Mastered ✅</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.stageProgressContainer}>
        <ProgressBar 
          word={word}
          widthInterpolated={widthInterpolated}
        />
      </View>
      <Heading style={styles.welshWord}>{word.welsh}</Heading>
      <View style={styles.contentBelow}>
        {renderStageContent()}
      </View>

      {/* position the submit/next button at the bottom of the screen if stage 0, or stage 1 and user has submitted */}
      {(word.stage == 0 || (word.stage == 1 && showFeedback)) && (
        <View style={styles.nextButtonContainer}>
          <SubmitNextButton 
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            handleNextAfterFeedback={handleNextAfterFeedback}
            handleConfirmAnswer={handleConfirmAnswer}
          />
        </View>
      )}
    </View>
  );
}

function shuffle(array: string[]) {
  return [...array].sort(() => 0.5 - Math.random());
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    height: '100%',
  },

  stage: {
    // position: 'absolute',
    top: '20%',
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },

  welshWord: {
    // position: 'absolute',
    top: '25%',
    width: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '600',
  },

  contentBelow: {
    marginTop: 200, // Reduced from 80% to make content more visible
    alignItems: 'center',
    width: '100%',
  },

  cardContainer: {
    // marginTop:  100,
    width: '100%',
    alignItems: 'center',
    gap: 12,
   },

  cardText: {
    fontSize: 27,
    fontWeight: '400',
  },

  stageZeroHighlight: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },

  stageZeroDescription: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
  },

  container: {
    alignItems: 'center',
    margin: 20
  },

  translation: {
    fontSize: 20,
    marginTop: 10,
    color: 'gray',
  },

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
    shadowOpacity: 0.25, // #00000040 = rgba(0,0,0,0.25)
    shadowRadius: 4,

    // Android shadow
    elevation: 4,
  },
  correctOption: {
    backgroundColor: Colors['light']['correct'], // Green
  },
  incorrectOption: {
    borderWidth: 4,
    borderColor: Colors['light']['incorrect'],
  },
  checkMark: {
    position: 'absolute',
    right: 15,
    fontSize: 20,
    color: '#ffffff',
  },
  inputContainer: {
    width: '80%',
    // maxWidth: 400,
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
  
  mastered: {
    fontSize: 18,
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    // paddingBottom: 10,
    zIndex: 100,
  },
  correctButton: {
    backgroundColor: Colors['light']['correct'], // Green
  },
  incorrectButton: {
    backgroundColor: Colors['light']['incorrect'], // Red
  },
  tickText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  correctAnswerContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8f8f8', // Light background
    borderWidth: 1,
    borderColor: Colors['light']['incorrect'],
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#333',
  },
  correctAnswer: {
    fontWeight: 'bold',
    color: Colors['light']['incorrect'],
  },
  stageProgressContainer: {
    position: 'absolute',
    top: '20%',
    // width: '40%',
    maxWidth: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
  },

});