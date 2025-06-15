import React, { useState } from 'react';

import { TextInput, FlatList, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, View } from '@/components/Themed';

import { useWords } from '@/contexts/UserContext';
import ProgressBar from '@/components/flashcard/common/ProgressBar';

export default function AllWordsScreen() {
  const { words } = useWords();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'welsh' | 'stage'>('stage');

  const filtered = words
    .filter(w => w.welsh.toLowerCase().includes(query.toLowerCase()) && w.stage > 0)
    .sort((a, b) => {
      if (sortBy === 'welsh') return a.welsh.localeCompare(b.welsh);
      return b.stage - a.stage;
  }); 

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>All Words</Text> */}
      <TextInput
        placeholder="Search Welsh word"
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      <View style={styles.sortRow}>
        <TouchableOpacity onPress={() => setSortBy('welsh')}>
          <Text style={[styles.sortButton, sortBy === 'welsh' && styles.activeSort]}>
            Sort by Welsh
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortBy('stage')}>
          <Text style={[styles.sortButton, sortBy === 'stage' && styles.activeSort]}>
            Sort by Stage
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.index.toString()}
        renderItem={({ item }) => {
           // Create a static animated value of 1
          const animatedValue = new Animated.Value(1);
          // Interpolate it to get the desired width as a percentage string
          const widthInterpolated = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${(0.1 + 0.9 * (item.streak) / 3) * 100}%`]
          });
          
          return (
            <View style={styles.wordItem}>
              <Text style={styles.wordText}>{item.welsh} — {item.english}</Text>
              <View style={styles.stageProgressContainer}>
                <ProgressBar word={item} widthInterpolated={widthInterpolated} />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  // title: {
  //   fontSize: 24,
  //   fontWeight: '600',
  //   marginBottom: 16,
  //   textAlign: 'center',
  // },
  input: {
    height: 60,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 27,
    paddingHorizontal: 10,
    marginBottom: 12,
    color: "#888",
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  sortButton: {
    // fontSize: 14,
  },
  activeSort: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  wordItem: {
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  wordText: {
    // fontSize: 16,
    fontWeight: '500',
  },
  stageText: {
    // fontSize: 12,
  },
  stageProgressContainer: {
    top: '20%',
    maxWidth: '40%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
});
