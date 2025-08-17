import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type ExitButtonProps = {
  onPress: () => void;
};

export default function ExitButton({ onPress }: ExitButtonProps) {
  return (
    <TouchableOpacity style={styles.exitButton} onPress={onPress}>
      <Ionicons name="close" size={28} color={Colors.light.upperButtonGradient} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exitButton: {
    position: 'absolute',
    top: 40, // adjust for safe area if needed
    left: 20,
    zIndex: 10,
    padding: 5,
  },
});
