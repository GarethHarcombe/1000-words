// ProfileScreen.tsx - use the context so selections sync with Map
import React, { useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
import { useRouter } from 'expo-router';
import { useWords } from '@/contexts/UserContext';
import WeeklyProgressChart from '@/components/profile/WeeklyProgressChart';
import WordProgressPieChart from '@/components/profile/WordProgressPieChart';
import CustomisableCaravan from '@/components/caravan/customisableCaravan';
import AccessoryCarousel from '@/components/profile/CaravanAccessoryCarousel';
import { useCaravanAccessories } from '@/contexts/CaravanContext';
import Colors from '@/constants/Colors';

export default function ProfileScreen() {
  const { words } = useWords();
  const router = useRouter();
  const { accessories, toggleAccessory } = useCaravanAccessories();

  const onToggle = useCallback((k: any) => toggleAccessory(k), [toggleAccessory]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.main}>
        <WordProgressPieChart words={words} />
        <WeeklyProgressChart />

        <View style={styles.card}>
          <Heading style={styles.cardTitle}>Your Caravan</Heading>
          <Text style={styles.cardSubtitle}>Personalise your ride</Text>

          <View style={styles.caravanRow}>
            <CustomisableCaravan size={180} accessories={accessories} />
          </View>

          <View style={{ marginTop: 12 }}>
            <AccessoryCarousel selected={accessories} onToggle={onToggle} />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/all-words')}>
          <Text style={styles.buttonText}>View All Words</Text>
        </TouchableOpacity>

        <Text style={styles.memoir}>In memory of Tadcu<br></br>Cymro balch - a proud Welshman</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    maxWidth: 1000,
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.light.background, 
    alignItems: 'center', 
    gap: 16,
  },
  card: { 
    width: '100%', 
    backgroundColor: Colors.light.background, 
    borderRadius: 12, 
    padding: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 4 
  },
  cardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.light.text 
  },
  cardSubtitle: { 
    fontSize: 14, 
    color: Colors.light.subtitle, 
    marginBottom: 8 
  },
  caravanRow: { 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    minHeight: 200 
  },
  button: { 
    marginTop: 10, 
    height: 56, 
    borderRadius: 28, 
    width: '80%', 
    maxWidth: 350, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: Colors.light.tint, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 4 
  },
  buttonText: { 
    color: Colors.light.background, 
    fontWeight: '600', 
    fontSize: 16 
  },
  memoir: {
    margin: 20,
    textAlign: 'center',
    fontSize: 12,
  },
});
