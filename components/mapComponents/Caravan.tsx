// components/mapComponents/Caravan.tsx
import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { ACCESSORY_IMAGES, AccessoryKey, getAccessoryStyle } from '@/components/caravan/accessories';

export interface Position {
  x: number;
  y: number;
}


interface CaravanProps {
  targetPosition: Position;
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  accessories?: AccessoryKey[];
  caravanSize?: number;
  speed?: number;
  initialPosition?: Position;
}


const Caravan: React.FC<CaravanProps> = ({
  targetPosition,
  isMoving,
  setIsMoving,
  accessories = [],                   // default none
  caravanSize = 80,
  speed = 100,
  initialPosition = { x: 400, y: 150 },
}) => {
  const caravanX = useSharedValue(initialPosition.x);
  const caravanY = useSharedValue(initialPosition.y);
  const isFacingLeft = useSharedValue(false);

  // Rotation progress
  const rotationProgress = useSharedValue(0);

  useEffect(() => {
    if (!isMoving) return;

    if (!Number.isFinite(targetPosition.x) || !Number.isFinite(targetPosition.y)) {
      runOnJS(setIsMoving)(false);
      return;
    }

    const dx = targetPosition.x - caravanX.value;
    const dy = targetPosition.y - caravanY.value;

    // Match your existing facing logic
    isFacingLeft.value = dx > 0;

    const distance = Math.hypot(dx, dy);
    const safeSpeed = speed > 0 ? speed : 1;
    let duration = (distance / safeSpeed) * 1000;
    if (!Number.isFinite(duration) || duration < 0) duration = 1;

    // Animate caravan position
    caravanX.value = withTiming(targetPosition.x, { duration, easing: Easing.linear }, finished => {
      if (finished) runOnJS(setIsMoving)(false);
    });
    caravanY.value = withTiming(targetPosition.y, { duration, easing: Easing.linear });

    // Animate wheel rotation
    rotationProgress.value = withTiming(rotationProgress.value - distance / 2, {
      duration,
      easing: Easing.linear,
    });
  }, [targetPosition, isMoving, speed]);


  // Container style
  const caravanStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: caravanSize,
    height: caravanSize,
    left: caravanX.value - caravanSize / 2,
    top: caravanY.value - caravanSize / 2,
    transform: [{ scaleX: isFacingLeft.value ? -1 : 1 }],
    zIndex: 30,
  }));


  // Wheel rotation - 1 full rotation per 50 px traveled
  const wheelRotation = useDerivedValue(() => {
    const angle = (rotationProgress.value / 50) * 360;
    return `${angle}deg`;
  });

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: wheelRotation.value }],
  }));

  return (
    <Animated.View style={caravanStyle}>
      {/* Behind-body accessories like wings */}
      {accessories.includes('wings') && (
        <Image
          source={ACCESSORY_IMAGES.wings}
          style={getAccessoryStyle('wings', caravanSize)}
          resizeMode="contain"
        />
      )}

      {/* Caravan body */}
      <Image
        source={require('@/assets/images/good-icons/caravan_shell.png')}
        style={styles.caravanBody}
        resizeMode="contain"
      />

      {/* Top-of-body accessories */}
      {accessories.includes('surf') && (
        <Image
          source={ACCESSORY_IMAGES.surf}
          style={getAccessoryStyle('surf', caravanSize)}
          resizeMode="contain"
        />
      )}
      {accessories.includes('suitcases') && (
        <Image
          source={ACCESSORY_IMAGES.suitcases}
          style={getAccessoryStyle('suitcases', caravanSize)}
          resizeMode="contain"
        />
      )}

      {/* Wheels */}
      <Animated.Image
        source={require('@/assets/images/good-icons/front_wheel_caravan.png')}
        style={[styles.wheel, styles.frontWheel, wheelStyle]}
        resizeMode="contain"
      />
      <Animated.Image
        source={require('@/assets/images/good-icons/back_wheel_caravan.png')}
        style={[styles.wheel, styles.backWheel, wheelStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  caravanBody: {
    width: '100%',
    height: '100%',
  },
  wheel: {
    position: 'absolute',
    width: 7,
    height: 15,
    bottom: 5,
  },
  frontWheel: {
    right: 27.5,
  },
  backWheel: {
    left: 29.5,
  },
});

export default Caravan;
