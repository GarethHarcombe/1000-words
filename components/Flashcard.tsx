import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Word } from '../constants/Types';
import { Text, View } from './Themed';

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

  const renderTickButton = () => {
    return (
      <TouchableOpacity 
        style={[
          styles.tickButton,
          showFeedback && (isCorrect ? styles.correctButton : styles.incorrectButton)
        ]}
        onPress={showFeedback ? handleNextAfterFeedback : handleConfirmAnswer}
      >
        <Text style={styles.tickText}>✓</Text>
      </TouchableOpacity>
    );
  };

  const renderStageContent = () => {
    switch (word.stage) {
      case 0:
        return (
          <View style={styles.cardContainer}>
            <Text style={styles.cardText}>{word.english}</Text>
            {renderTickButton()}
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
                  selectedOption === option && styles.selectedOption,
                  showFeedback && selectedOption === option && !isCorrect && styles.incorrectOption,
                  showFeedback && option === word.english && styles.correctOption
                ]}
                onPress={() => {
                  if (!showFeedback) {
                    setSelectedOption(option);
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
            {renderTickButton()}
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
                placeholder="Enter the English translation"
                editable={!showFeedback}
              />
              {renderTickButton()}
            </View>
            {showFeedback && !isCorrect && (
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>
                  Correct answer: <Text style={styles.correctAnswer}>{word.english}</Text>
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
      <Text style={styles.stage}>Stage: {word.stage}</Text>
      <Text style={styles.welshWord}>{word.welsh}</Text>
      <View style={styles.contentBelow}>
        {renderStageContent()}
      </View>
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
    top: '30%',
    width: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '600',
  },
  contentBelow: {
    marginTop: '80%', // pushes rest of the content below the Welsh word
    alignItems: 'center',
  },
  cardContainer: {
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    fontSize: 22,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    margin: 20
  },
  optionsContainer: {
    marginTop: 20,
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  optionCard: {
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: '#aaa',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  correctOption: {
    backgroundColor: '#4CAF50', // Green
  },
  incorrectOption: {
    backgroundColor: '#F44336', // Red
  },
  checkMark: {
    position: 'absolute',
    right: 15,
    fontSize: 20,
    color: '#ffffff',
  },
  inputContainer: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    fontSize: 18,
    padding: 8,
    color: "#888",
    marginRight: 10,
  },
  mastered: {
    fontSize: 18,
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
  tickButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  correctButton: {
    backgroundColor: '#4CAF50', // Green
  },
  incorrectButton: {
    backgroundColor: '#F44336', // Red
  },
  tickText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  correctAnswerContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)', // Light green
  },
  correctAnswerText: {
    fontSize: 16,
  },
  correctAnswer: {
    fontWeight: 'bold',
    color: '#4CAF50',
  }
});