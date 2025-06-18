import React from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { Text, View } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
import Colors from '@/constants/Colors';

type InfoBottomSheetProps = {
  isOpen: boolean;
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
  currentStage: number;
};

/**
 * A bottom sheet component that displays information about the flashcard stages
 */
export default function InfoBottomSheet({ 
  isOpen, 
  setIsOpen, 
  currentStage 
}: InfoBottomSheetProps) {
  return (
    <BottomSheet 
      bottomSheetHeight={500}
      isBottomSheetUp={isOpen}
      setIsTownPopup={setIsOpen}
    >
      <View style={styles.infoContentContainer}>
        <Text style={styles.infoTitle}>How Flashcards Work</Text>
        
        <View style={[styles.stageInfoCard, currentStage === 0 && styles.highlightedStage]}>
          <Text style={styles.stageTitle}>Stage 1: Introduction</Text>
          <Text style={styles.stageDescription}>
            Words start here. You're shown both the Welsh word and its English meaning.
            Look at the word, pronounce it, and press "Next" to continue.
          </Text>
        </View>
        
        <View style={[styles.stageInfoCard, currentStage === 1 && styles.highlightedStage]}>
          <Text style={styles.stageTitle}>Stage 2: Multiple Choice</Text>
          <Text style={styles.stageDescription}>
            Select the correct English translation from the options.
            This helps reinforce your recognition of the word.
          </Text>
        </View>
        
        <View style={[styles.stageInfoCard, currentStage === 2 && styles.highlightedStage]}>
          <Text style={styles.stageTitle}>Stage 3: Recall</Text>
          <Text style={styles.stageDescription}>
            Type the English meaning of the Welsh word.
            This tests your active recall - the strongest form of memory.
          </Text>
        </View>
        
        <View style={styles.stageProgressInfo}>
          <Text style={styles.progressDescription}>
            The progress bar shows how close you are to mastering each word.
            Get answers right to fill the bar. Three correct answers in a row masters a word!
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  infoContentContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  infoTitle: {
    fontSize: 30,
    fontWeight: '400',
    marginBottom: 20,
    textAlign: 'center',
  },
  stageInfoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  highlightedStage: {
    borderLeftColor: Colors.light.upperButtonGradient,
    backgroundColor: '#f0f7ff',
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  stageProgressInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  progressDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  }
});