import React, { useState } from 'react';
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
    
    const [input, setInput] = React.useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    React.useEffect(() => {
        // If the word is at stage 2, focus the input
        if (word.stage === 2 && inputRef.current) {
          // Small delay to ensure the keyboard appears after component mount/update
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      }, [word]); // This effect runs whenever the word changes

    const renderStageContent = () => {
      switch (word.stage) {
        case 0:
          return (
            <View style={styles.cardContainer}>
              <TouchableOpacity style={styles.optionCard} onPress={onCorrectAnswer}>
                <Text style={styles.cardText}>{word.english}</Text>
              </TouchableOpacity>
            </View>
          );
        case 1:
          // Placeholder: Add multiple choice here
          return (
            <View style={styles.optionsContainer}>
                {shuffle([word.english, ...fillerAnswers]).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionCard,
                    // selectedOption === option && { backgroundColor: '#cce5cc' }
                  ]}
                  onPress={() => {
                    setSelectedOption(option);

                    if (option === word.english) {
                        onCorrectAnswer();
                    }
                    else {
                        onFalseAnswer();
                    }}}
                >
                  <Text style={styles.cardText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        case 2:
          return (
            <View style={styles.optionsContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => {
                    if (input.trim().toLowerCase() === word.english.toLowerCase()) {
                      onCorrectAnswer();
                    }
                    else {
                      onFalseAnswer();
                    }
                    
                    setInput('');
                  }}
                placeholder="Enter the English translation"
              />
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

function getRandomItems(array: string[], count: number) {
    return array
      .sort(() => 0.5 - Math.random())
      .slice(0, count);
  }

function shuffle(array: string[]) {
  return array.sort(() => 0.5 - Math.random());
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
    cardButton: {
    backgroundColor: '#ddd',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 6,
    width: '100%',
    alignItems: 'center',
    },
    cardText: {
    fontSize: 22,
    fontWeight: '600',
    },
  container: {
    alignItems: 'center',
    margin: 20
  },
  card: {
    backgroundColor: '#fff',
    padding: 32,
    marginVertical: 16,
    borderRadius: 12,
    elevation: 5,
  },
  translation: {
    fontSize: 20,
    marginTop: 10,
    color: 'gray',
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
    alignItems: 'center'
  },
  input: {
    marginTop: 20,
    borderBottomWidth: 1,
    width: '80%',
    fontSize: 18,
    padding: 8,
    color: "#888",
  },
  mastered: {
    fontSize: 18,
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
});
