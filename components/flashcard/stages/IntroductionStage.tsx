import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Word } from '@/constants/Types';

type IntroductionStageProps = {
  word: Word;
};

export default function IntroductionStage({ word }: IntroductionStageProps) {
  
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardText}>{word.english}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  cardText: {
    fontSize: 27,
    fontWeight: '400',
  },
});