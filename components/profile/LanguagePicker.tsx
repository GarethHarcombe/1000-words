import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { useUserContext, Language } from '@/contexts/UserContext';
import { View, Text } from '@/components/Themed';

export const LanguagePicker = () => {
  const { language, setLanguage } = useUserContext();

  if (!language) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Language</Text>

      <Picker
        selectedValue={language}
        onValueChange={(value) => setLanguage(value as Language)}
      >
        <Picker.Item label="Welsh" value="welsh" />
        <Picker.Item label="Spanish" value="spanish" />
        <Picker.Item label="Te reo Māori" value="maori" />
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    width: 300,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
});
