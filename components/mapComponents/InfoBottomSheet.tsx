import React from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet from '@/components/BottomSheet';
import { Text, View } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
import Colors from '@/constants/Colors';

type InfoBottomSheetProps = {
  isOpen: boolean;
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
};

/**
 * A bottom sheet component that displays information about the flashcard stages
 */
export default function InfoBottomSheet({ 
  isOpen, 
  setIsOpen, 
}: InfoBottomSheetProps) {
  return (
    <BottomSheet 
      bottomSheetHeight={250}
      isBottomSheetUp={isOpen}
      setIsTownPopup={setIsOpen}
    >
      <View style={styles.infoContentContainer}>
        <Text style={styles.infoTitle}>How The Map Works</Text>
        
        <View style={styles.stageProgressInfo}>
          <Text style={styles.progressDescription}>
            Click and drag or tap to move around the map, and scroll or pinch to zoom in and out.

            Each town on the map has a different category of words to practice. Use your coins to unlock new towns and explore more words!
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