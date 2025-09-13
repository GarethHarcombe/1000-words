// Caravan.tsx
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface Position {
  x: number;
  y: number;
}

interface CaravanProps {
  targetPosition: Position;
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  caravanSize?: number;
  speed?: number; // pixels per second in the same rendered coordinate space as targetPosition
  initialPosition?: Position;
}

const Caravan: React.FC<CaravanProps> = ({
  targetPosition,
  isMoving,
  setIsMoving,
  caravanSize = 40,
  speed = 100,
  initialPosition = { x: 400, y: 150 },
}) => {
  const caravanX = useSharedValue(initialPosition.x);
  const caravanY = useSharedValue(initialPosition.y);
  const isFacingLeft = useSharedValue(false);

  useEffect(() => {
    if (!isMoving) return;

    const dx = targetPosition.x - caravanX.value;
    const dy = targetPosition.y - caravanY.value;

    // Face left when movement is to the right (to match your original logic)
    isFacingLeft.value = dx > 0;

    const distance = Math.hypot(dx, dy);
    const duration = (distance / speed) * 1000;

    caravanX.value = withTiming(
      targetPosition.x,
      { duration, easing: Easing.linear },
      finished => {
        if (finished) runOnJS(setIsMoving)(false);
      }
    );

    caravanY.value = withTiming(targetPosition.y, {
      duration,
      easing: Easing.linear,
    });
  }, [targetPosition, isMoving, speed]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: caravanSize,
    height: caravanSize,
    left: caravanX.value - caravanSize / 2,
    top: caravanY.value - caravanSize / 2,
    transform: [{ scaleX: isFacingLeft.value ? -1 : 1 }],
    zIndex: 30,
  }));

  return (
    <Animated.Image
      source={require('@/assets/images/caravan_new.png')}
      style={style}
      resizeMode="contain"
    />
  );
};

export default Caravan;
