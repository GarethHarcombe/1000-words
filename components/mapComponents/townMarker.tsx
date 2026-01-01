
import { TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/Colors';

export function TownMarker({
  rendered,
  source,
  onPress,
}: {
  rendered: { x: number; y: number };
  source: any;
  onPress: () => void;
}) {

  const ICON_SIZE = 40;
  const ICON_HALF = ICON_SIZE / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.townMarker,
        {
          top: rendered.y - ICON_HALF,
          left: rendered.x - ICON_HALF,
          width: ICON_SIZE,
          height: ICON_SIZE,
        },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  townMarker: {
    position: 'absolute',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 100,
    // borderWidth: 1,
    // borderColor: '#222',
    // elevation: 5,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    backgroundColor: Colors.light.darkBackground,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
    zIndex: 20,
  },
});
