import React, { useState } from 'react';
import { TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';

import { useWords } from '@/contexts/UserContext';

export default function AllWordsScreen() {
  const { words } = useWords();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'welsh' | 'stage'>('welsh');

  const filtered = words
    .filter(w => w.welsh.toLowerCase().includes(query.toLowerCase()))
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
        renderItem={({ item }) => (
          <View style={styles.wordItem}>
            <Text style={styles.wordText}>{item.welsh} — {item.english}</Text>
            <Text style={styles.stageText}>Stage: {item.stage}</Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    color: "#888",
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  sortButton: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '500',
  },
  stageText: {
    fontSize: 12,
  },
});
