import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View, TouchableOpacity } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
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
      <Heading style={styles.title}>Your Progress</Heading>
      <View style={styles.statsRow}>
        <Text style={styles.stat}>Seen: {seen}</Text>
        <Text style={styles.stat}>Practiced: {practiced}</Text>
        <Text style={styles.stat}>Mastered: {mastered}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button} 
          onPress={() => router.push('/all-words')}>
            <Text>View all Words</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  buttonsContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
  },
  button: {
    width: 300,
    height: 56,
    // padding: 10,
    justifyContent: 'center',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  }
});
