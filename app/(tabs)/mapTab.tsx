import { StyleSheet } from 'react-native';
import { useState } from 'react';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { Word } from '../../constants/Types';
import { useWords } from '@/contexts/UserContext';

import Map from '@/components/mapComponents/Map';

import InfoBottomSheet from '@/components/mapComponents/InfoBottomSheet'
import InfoButton from '@/components/flashcard/common/InfoButton';

export default function MapScreen() {
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);

  return (
    <View style={styles.container}>
      <InfoButton onPress={() => setIsInfoSheetOpen(true)} />

      <Map/>

      <InfoBottomSheet 
        isOpen={isInfoSheetOpen}
        setIsOpen={setIsInfoSheetOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
