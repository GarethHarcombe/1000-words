import React from 'react';
import { Button, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWords } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { setOptions } from 'expo-splash-screen';

export default function ProfileScreen() {
  const { words } = useWords();
  const router = useRouter();

  const seen = words.filter(w => w.stage >= 1).length;
  const practiced = words.filter(w => w.stage >= 2).length;
  const mastered = words.filter(w => w.stage === 3).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>Seen: {seen}</Text>
        <Text style={styles.stat}>Practiced: {practiced}</Text>
        <Text style={styles.stat}>Mastered: {mastered}</Text>
      </View>
      <Button title="View All Words" onPress={() => router.push('/all-words')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  stat: {
    fontSize: 16,
    fontWeight: '500',
  },
});
