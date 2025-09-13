import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  // runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

interface Position {
  x: number;
  y: number;
}

interface CaravanProps {
  targetPosition: Position;
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  scaleX: number;
  scaleY: number;
  /** Overall rendered size of the caravan composite in px */
  size?: number;
  /** Linear travel speed in px/s on the map */
  speed?: number;
  /** Wheel visual size in px (each wheel is rendered as a square) */
  wheelSize?: number;
  /** Optional initial position */
  initial?: Position;
}

const DEFAULT_SIZE = 40;
const DEFAULT_SPEED = 300; // px/s
const DEFAULT_WHEEL_SIZE = 8;

// Spring configs
const SPRING_SOFT = {
  damping: 14,
  stiffness: 140,
  mass: 1,
};
const SPRING_RETURN = {
  damping: 16,
  stiffness: 160,
  mass: 1,
};

// Bounce amplitudes (in px) and tilt amplitude (in deg)
const BOB_AMPLITUDE = 2;     // continuous bob while moving
const LANDING_BOUNCE = 6;    // one-off bounce when stopping
const TILT_AMPLITUDE = 1.2;  // degrees

export default function Caravan({
  targetPosition,
  isMoving,
  setIsMoving,
  scaleX,
  scaleY,
  size = DEFAULT_SIZE,
  speed = DEFAULT_SPEED,
  wheelSize = DEFAULT_WHEEL_SIZE,
  initial = { x: 1500, y: 400 },
  
}: CaravanProps) {
  // Position values in map coordinates
  const caravanX = useSharedValue(initial.x);
  const caravanY = useSharedValue(initial.y);

  // Facing left-right
  const [isFacingLeft, setIsFacingLeft] = useState(false);

  // keep JS refs in sync to avoid reading .value
  const lastX = useRef(initial.x);
  const lastY = useRef(initial.y);

  // Wheel rotation values (degrees)
  const frontWheelRotation = useSharedValue(0);
  const backWheelRotation = useSharedValue(0);

  // Suspension and tilt effects
  const suspensionY = useSharedValue(0); // positive is downwards
  const tiltDeg = useSharedValue(0);

  // Compute the duration for one wheel revolution based on linear speed and wheel circumference
  const computeWheelRevolutionMs = (currentSpeed: number) => {
    if (currentSpeed <= 0) return 400; // fallback
    const r = wheelSize / 2; // px
    const circumference = 2 * Math.PI * r; // px
    const secondsPerRev = circumference / currentSpeed; // s
    const ms = secondsPerRev * 1000;
    // Clamp to a reasonable range
    return Math.min(Math.max(ms, 120), 1200);
  };

  useEffect(() => {
    // start/stop logic runs on UI runtime to safely access shared values
    if (isMoving) {
      scheduleOnUI(() => {
        'worklet';

        // compute dx/dy using shared values on UI runtime (safe)
        const dx = targetPosition.x - caravanX.value;
        const dy = targetPosition.y - caravanY.value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const durationMs = (distance / speed) * 1000;

        // tell RN about facing direction
        scheduleOnRN(() => {
          // runs on RN runtime / JS thread
          setIsFacingLeft(dx < 0); // choose <0 or >0 to match your convention
        });

        // start linear motion on UI runtime (safe)
        caravanX.value = withTiming(
          targetPosition.x,
          { duration: durationMs, easing: Easing.linear },
          (finished) => {
            if (finished) {
              suspensionY.value = withSequence(
                withTiming(LANDING_BOUNCE, { duration: 120, easing: Easing.out(Easing.quad) }),
                withSpring(0, SPRING_RETURN)
              );
              tiltDeg.value = withSpring(0, SPRING_RETURN);
              scheduleOnRN(() => setIsMoving(false));
            }
          }
        );

        caravanY.value = withTiming(targetPosition.y, { duration: durationMs, easing: Easing.linear });

        // wheels: reset then repeat (on UI runtime)
        frontWheelRotation.value = 0;
        backWheelRotation.value = 0;
        const revMs = computeWheelRevolutionMs(speed);
        frontWheelRotation.value = withRepeat(withTiming(360, { duration: revMs, easing: Easing.linear }), -1, false);
        backWheelRotation.value = withRepeat(withTiming(360, { duration: revMs, easing: Easing.linear }), -1, false);

        // bob and tilt
        cancelAnimation(suspensionY);
        suspensionY.value = withRepeat(
          withSequence(
            withTiming(BOB_AMPLITUDE, { duration: 350, easing: Easing.inOut(Easing.quad) }),
            withTiming(-BOB_AMPLITUDE, { duration: 350, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );

        cancelAnimation(tiltDeg);
        tiltDeg.value = withRepeat(
          withSequence(
            withTiming(TILT_AMPLITUDE, { duration: 400, easing: Easing.inOut(Easing.quad) }),
            withTiming(-TILT_AMPLITUDE, { duration: 400, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );
      });
    } else {
      // stopping: read current rotation & finish on UI thread
      scheduleOnUI(() => {
        'worklet';
        cancelAnimation(frontWheelRotation);
        cancelAnimation(backWheelRotation);
        cancelAnimation(suspensionY);

        const frontNow = frontWheelRotation.value % 360;
        const backNow = backWheelRotation.value % 360;
        frontWheelRotation.value = withTiming(frontNow + 120, { duration: 200, easing: Easing.out(Easing.cubic) });
        backWheelRotation.value = withTiming(backNow + 120, { duration: 200, easing: Easing.out(Easing.cubic) });

        tiltDeg.value = withSpring(0, SPRING_RETURN);
        if (suspensionY.value !== 0) suspensionY.value = withSpring(0, SPRING_SOFT);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPosition, isMoving, speed, wheelSize]);

  const caravanStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size,
    height: size,
    left: Number.isFinite(caravanX.value) ? (caravanX.value - size/2) * scaleX : 0,
    top: Number.isFinite(caravanY.value) ? (caravanY.value - size/2 + suspensionY.value) * scaleY : 0,

    // and for deg strings:
    rotateZ: `${Number.isFinite(tiltDeg.value) ? tiltDeg.value : 0}deg`,
    // left: (caravanX.value - size / 2) * scaleX,
    // top: (caravanY.value - size / 2 + suspensionY.value) * scaleY,
    transform: [
      { scaleX: isFacingLeft ? -1 : 1 },
      // { rotateZ: `${tiltDeg.value}deg` },
    ],
    zIndex: 30,
  }));

  const frontWheelStyle = useAnimatedStyle(() => ({
    width: wheelSize,
    height: wheelSize,
    transform: [{ rotate: `${frontWheelRotation.value}deg` }],
  }));

  const backWheelStyle = useAnimatedStyle(() => ({
    width: wheelSize,
    height: wheelSize,
    transform: [{ rotate: `${backWheelRotation.value}deg` }],
  }));

  // Wheel placement is relative to the caravan container.
  // Tweak these offsets to match your artwork.
  const WHEEL_BOTTOM_OFFSET = size * 0.19; // how far up from the bottom
  const BACK_WHEEL_LEFT = size * 0.22;
  const FRONT_WHEEL_RIGHT = size * 0.165;

  return (
    <Animated.View style={caravanStyle}>
      {/* Caravan shell */}
      <Image
        source={require('@/assets/images/campervan_shell.png')}
        style={styles.shell}
        resizeMode="contain"
      />
      {/* Back wheel */}
      <Animated.Image
        source={require('@/assets/images/campervan_wheel_back.png')}
        style={[
          styles.backWheel,
          backWheelStyle,
          {
            bottom: WHEEL_BOTTOM_OFFSET,
            left: BACK_WHEEL_LEFT - wheelSize / 2,
          },
        ]}
        resizeMode="contain"
      />
      {/* Front wheel */}
      <Animated.Image
        source={require('@/assets/images/campervan_wheel_front.png')}
        style={[
          styles.frontWheel,
          frontWheelStyle,
          {
            bottom: WHEEL_BOTTOM_OFFSET,
            right: FRONT_WHEEL_RIGHT - wheelSize / 2,
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  backWheel: {
    position: 'absolute',
  },
  frontWheel: {
    position: 'absolute',
  },
});
