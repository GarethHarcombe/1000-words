import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Word } from '../constants/Types';
import { Text, View, TouchableOpacity } from './Themed';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading } from '@/components/StyledText';
import Colors from '@/constants/Colors';
import Icon from 'react-native-vector-icons/Feather';

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

  const handleConfirmAnswer = () => {
    switch (word.stage) {
      case 0:
        // Simply proceed
        onCorrectAnswer();
        break;
      case 1:
        // Check if an option is selected
        if (selectedOption !== null) {
          setShowFeedback(true);
          const correct = selectedOption === word.english;
          setIsCorrect(correct);
        }
        break;
      case 2:
        // Check text input
        if (input.trim()) {
          setShowFeedback(true);
          const correct = input.trim().toLowerCase() === word.english.toLowerCase();
          setIsCorrect(correct);
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

  const renderNextButton = () => {
    // Only show next button for stage 1 if an option is selected or feedback is shown
    if (word.stage === 1 && !selectedOption && !showFeedback) {
      return null;
    }

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

  const renderStageContent = () => {
    switch (word.stage) {
      case 0:
        return (
          <View style={styles.cardContainer}>
            <Text style={styles.cardText}>{word.english}</Text>
          </View>
        );
      case 1:
        const options = shuffledOptions;
        return (
          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionCard,
                  showFeedback && selectedOption === option && !isCorrect && styles.incorrectOption,
                  showFeedback && option === word.english && styles.correctOption
                ]}
                onPress={() => {
                  if (!showFeedback) {
                    setSelectedOption(option);
                    // For stage 1, immediately show feedback after selection
                    const correct = option === word.english;
                    setIsCorrect(correct);
                    setShowFeedback(true);
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
                editable={!showFeedback}
              />
              {renderNextButton()}
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
      case 3:
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
        {[0, 1, 2].map((stageIndex) => (
          <View 
            key={stageIndex}
            style={[
              styles.stageBar,
              stageIndex < word.stage ? styles.completedStageBar : {},
              word.stage === stageIndex ? 
                { 
                  backgroundColor: 'transparent',
                  overflow: 'hidden',
                } : {}
            ]}
          >
            {word.stage === stageIndex && (
              <LinearGradient
                colors={[
                  Colors['light']['upperButtonGradient'], 
                  Colors['light']['lowerButtonGradient']
                ]}
                style={[
                  styles.progressGradient,
                  { 
                    width: `${(0.1 + 0.9 * (word.streak / 3)) * 100}%` 
                  }
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <Heading style={styles.welshWord}>{word.welsh}</Heading>
      <View style={styles.contentBelow}>
        {renderStageContent()}
      </View>
      {word.stage !== 2 && (
        <View style={styles.nextButtonContainer}>
          {renderNextButton()}
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
    
  },

  stage: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },

  welshWord: {
    position: 'absolute',
    top: '25%',
    width: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '600',
  },

  contentBelow: {
    marginTop: '75%', // Reduced from 80% to make content more visible
    alignItems: 'center',
    width: '100%',
  },

  cardContainer: {
    marginTop: '15%',
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
  selectedOption: {
    backgroundColor: '#aaa',
    // borderWidth: 2,
    // borderColor: '#ffffff',
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
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
  tickButton: {
    overflow: 'hidden',
  },
  nextButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  
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
    width: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  
  stageBar: {
    height: 15,
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    position: 'relative',
  },
  
  completedStageBar: {
    backgroundColor: Colors['light']['correct'],
  },
  
  progressGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  }
});