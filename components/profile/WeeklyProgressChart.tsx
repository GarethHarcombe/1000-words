import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackedBarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import Colors from '@/constants/Colors';

export default function WeeklyProgressChart() {
  // Demo stacked data for each day
  type DataPoint = { seen: number; practiced: number; mastered: number };

  const data: DataPoint[] = [
    { seen: 5, practiced: 2, mastered: 1 },
    { seen: 3, practiced: 4, mastered: 2 },
    { seen: 6, practiced: 1, mastered: 3 },
    { seen: 4, practiced: 3, mastered: 4 },
    { seen: 7, practiced: 2, mastered: 5 },
    { seen: 5, practiced: 5, mastered: 3 },
    { seen: 6, practiced: 4, mastered: 6 },
  ];

  const keys: (keyof DataPoint)[] = ['seen', 'practiced', 'mastered'];

  const yAxisData = data.map(d =>
    keys.reduce((sum, key) => sum + d[key], 0)
  );

  const colors = [
    Colors.light.lowerButtonGradient,  // Seen
    Colors.light.upperButtonGradient,     // Practiced
    Colors.light.correct,  // Mastered
  ];

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This Week's Activity</Text>
      <View style={{ flexDirection: 'row', height: 220, paddingVertical: 16 }}>
        <YAxis
          data={yAxisData}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fontSize: 12, fill: Colors.light.text }}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <StackedBarChart
            style={{ flex: 1 }}
            keys={keys}
            colors={colors}
            data={data}
            showGrid={false}
            contentInset={{ top: 20, bottom: 20 }}
          >
            <Grid />
          </StackedBarChart>
          <XAxis
            style={{ marginTop: 10 }}
            data={data}
            formatLabel={(value: number, index: number): string => labels[index]}
            contentInset={{ left: 15, right: 15 }}
            svg={{ fontSize: 12, fill: Colors.light.text }}
          />
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: Colors.light.lowerButtonGradient }]} />
          <Text style={styles.legendText}>Seen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: Colors.light.upperButtonGradient }]} />
          <Text style={styles.legendText}>Practiced</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: Colors.light.correct }]} />
          <Text style={styles.legendText}>Mastered</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.text,
  },
});
