// at the top, after your imports
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedImage = Animated.createAnimatedComponent(Image);

// A minimal marker that follows layout-scale
function TownMarker({
  rendered,           // { x, y } in BASE rendered coords from townToRendered
  source,
  onPress,
  scale,              // shared value from parent
}: {
  rendered: { x: number; y: number };
  source: any;
  onPress: () => void;
  scale: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const s = scale.value;
    return {
      position: 'absolute',
      top: (rendered.y - ICON_HALF) * s,
      left: (rendered.x - ICON_HALF) * s,
      width: ICON_SIZE * s,
      height: ICON_SIZE * s,
      zIndex: 20,
    };
  });

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.townMarker, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <AnimatedImage
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </AnimatedTouchableOpacity>
  );
}