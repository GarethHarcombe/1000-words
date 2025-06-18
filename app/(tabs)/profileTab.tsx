// ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View, TouchableOpacity } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
import { useWords } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import moment from 'moment';

export default function ProfileScreen() {
  const { words } = useWords();
  const router = useRouter();

  const seen = words.filter(w => w.stage >= 1).length;
  const practiced = words.filter(w => w.stage >= 2).length;
  const mastered = words.filter(w => w.stage === 3).length;

  const [activity, setActivity] = useState<{ x: string; y: number }[]>([]);

  useEffect(() => {
    const today = moment();
    const generated = Array.from({ length: 7 }, (_, i) => {
      const x = today.clone().subtract(6 - i, 'days').format('YYYY-MM-DD');
      const y = Math.floor(Math.random() * 10);
      return { x, y };
    });
    setActivity(generated);
  }, []);


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Heading style={styles.title}>Your Progress</Heading>

      <View style={styles.chartContainer}>
        <VictoryPie
          data={[
            { x: 'Seen', y: seen },
            { x: 'Practiced', y: practiced },
            { x: 'Mastered', y: mastered }
          ]}
          colorScale={['#FDB813', '#1E90FF', '#32CD32']}
          labelRadius={60}
          style={{ labels: { fill: 'black', fontSize: 14 } }}
        />
      </View>

      <Heading style={styles.subheading}>This Week's Activity</Heading>
      <View style={styles.chartContainer}>
        <VictoryChart domainPadding={10}>
          <VictoryAxis
            tickFormat={(x: string) => moment(x).format('dd')}
            style={{ tickLabels: { fontSize: 10 } }}
          />
          <VictoryAxis dependentAxis tickFormat={(y: number) => y.toString()} />
          <VictoryBar
            data={activity}
            x="date"
            y="count"
            style={{ data: { fill: '#1E90FF' } }}
          />
        </VictoryChart>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/all-words')}>
        <Text>View All Words</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  button: {
    marginTop: 32,
    width: 300,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
