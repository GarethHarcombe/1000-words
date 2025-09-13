// components/profile/AccessoryCarousel.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Colors from '@/constants/Colors';
import { AccessoryKey } from '@/components/caravan/accessories';

const ACCESSORIES: { key: AccessoryKey; label: string; source: any }[] = [
  { key: 'wings', label: 'Wings', source: require('@/assets/images/good-icons/wings_cream.png') },
  { key: 'surf', label: 'Surfboard', source: require('@/assets/images/good-icons/surf.png') },
  { key: 'suitcases', label: 'Bags', source: require('@/assets/images/good-icons/suitcases.png') },
];

interface Props {
  selected: AccessoryKey[];
  onToggle: (key: AccessoryKey) => void;
}

const CARD_WIDTH = 120;
const GAP = 12;

const AccessoryCarousel: React.FC<Props> = ({ selected, onToggle }) => {
  return (
    <FlatList
      horizontal
      data={ACCESSORIES}
      keyExtractor={it => it.key}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      renderItem={({ item }) => {
        const isSelected = selected.includes(item.key);
        return (
          <TouchableOpacity
            onPress={() => onToggle(item.key)}
            activeOpacity={0.8}
            style={[
              styles.card,
              {
                // borderColor: isSelected ? Colors.light.tint : Colors.light.border,
                // backgroundColor: isSelected ? Colors.light.cardHighlight ?? '#f4f7ff' : Colors.light.background,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Image source={item.source} style={styles.image} resizeMode="contain" />
            <Text style={styles.label}>{item.label}</Text>
            <View style={[styles.pill, { backgroundColor: isSelected ? Colors.light.tint : '#fff' }]} />
          </TouchableOpacity>
        );
      }}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      snapToAlignment="start"
      bounces
    />
  );
};

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, height: 140, borderRadius: 12, padding: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  image: { width: CARD_WIDTH - 40, height: 64 },
  label: { marginTop: 8, fontWeight: '600' },
  pill: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5 },
});

export default AccessoryCarousel;
