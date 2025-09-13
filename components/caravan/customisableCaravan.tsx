// components/caravan/CustomisableCaravan.tsx
import React, { useMemo } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { ACCESSORY_IMAGES, AccessoryKey, getAccessoryStyle } from '@/components/caravan/accessories';

interface Props {
  size?: number;
  accessories?: AccessoryKey[];
}

const CustomisableCaravan: React.FC<Props> = ({ size = 180, accessories = [] }) => {
  const containerStyle = useMemo(
    () => [{ width: size, height: size }, styles.container],
    [size]
  );

  return (
    <View style={containerStyle}>
      {accessories.includes('wings') && (
        <Image
          source={ACCESSORY_IMAGES.wings}
          style={getAccessoryStyle('wings', size)}
          resizeMode="contain"
        />
      )}

      <Image
        source={require('@/assets/images/caravan_new.png')}
        style={styles.body}
        resizeMode="contain"
      />

      {accessories.includes('surf') && (
        <Image
          source={ACCESSORY_IMAGES.surf}
          style={getAccessoryStyle('surf', size)}
          resizeMode="contain"
        />
      )}
      {accessories.includes('suitcases') && (
        <Image
          source={ACCESSORY_IMAGES.suitcases}
          style={getAccessoryStyle('suitcases', size)}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  body: { position: 'absolute', width: '100%', height: '100%', zIndex: 2 },
});

export default CustomisableCaravan;
