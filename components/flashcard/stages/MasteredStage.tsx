import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function MasteredStage() {
  return (
    <View>
      <Text style={styles.mastered}>All Words Mastered ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mastered: {
    fontSize: 18,
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
});