// components/profile/WordProgressPieChart.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { Heading } from '@/components/StyledText';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { Word } from '@/constants/Types';

interface WordProgressPieChartProps {
  words: Word[];
}

const WordProgressPieChart: React.FC<WordProgressPieChartProps> = ({ words }) => {
  const total = words.length || 1;
  const stages = [
    { label: 'New', stage: 0, color: Colors.light.incorrect },
    { label: 'Seen', stage: 1, color: Colors.light.lowerButtonGradient },
    { label: 'Practiced', stage: 2, color: Colors.light.upperButtonGradient },
    { label: 'Mastered', stage: 3, color: Colors.light.correct },
  ];

  const data = stages
    .map(s => ({
      ...s,
      value: words.filter(w => w.stage === s.stage).length,
    }))
    .filter(s => s.value > 0);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No words to display</Text>
      </View>
    );
  }

  const createPieSlice = (item: typeof data[number], index: number): JSX.Element => {
    const size = 200;
    const radius = 80;
    const cx = size / 2;
    const cy = size / 2;
    const cumulative = data.slice(0, index).reduce((sum, d) => sum + d.value / total, 0);
    const percentage = item.value / total;

    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulative + percentage) * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = percentage > 0.5 ? 1 : 0;

    const pathData = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return (
      <Path
        key={index}
        d={pathData}
        fill={item.color}
        stroke={Colors.light.background}
        strokeWidth={2}
      />
    );
  };

  return (
    <View style={styles.chartCard}>
      <Heading style={styles.chartTitle}>Word Learning Progress</Heading>
      <Text style={styles.chartSubtitle}>Total words: {total}</Text>

      <Svg width="200" height="200" viewBox="0 0 200 200" style={{ marginVertical: 16 }}>
        {data.map(createPieSlice)}
      </Svg>

      {data.map((item, index) => (
        <View key={index} style={styles.statRow}>
          <View style={styles.statLeft}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
          <Text style={styles.statValue}>
            {item.value} ({((item.value / total) * 100).toFixed(1)}%)
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    width: '100%',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  chartSubtitle: {
    fontSize: 14,
    color: Colors.light.subtitle,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    paddingVertical: 8,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.subtitle,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.subtitle,
  },
});

export default WordProgressPieChart;
