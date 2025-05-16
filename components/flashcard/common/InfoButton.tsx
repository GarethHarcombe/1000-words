import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type InfoButtonProps = {
  onPress: () => void;
};

export default function InfoButton({ onPress }: InfoButtonProps) {
  return (
    <TouchableOpacity style={styles.infoButton} onPress={onPress}>
      <Ionicons name="information-circle" size={28} color={Colors.light.upperButtonGradient} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
});