
// components/AnimatedTabButton.tsx
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";

type Props = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  focused: boolean;
};

const SIZE = 92;

export function AnimatedTabButton({ name, color, focused }: Props) {
  const circle = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(circle);

    circle.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circle.value }],
    opacity: circle.value,
  }));

  return (
    <Animated.View pointerEvents="none" style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.circle, circleStyle]} />
      <MaterialCommunityIcons name={name} size={60} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  circle: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.light.midButtonGradient,
    borderColor: "#fff",
    borderWidth: 6,
  },
});
