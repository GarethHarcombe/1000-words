
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/Colors";

type Props = {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
  focused: boolean;
};

const SIZE = 92;

export function AnimatedTabButton({ name, color, focused }: Props) {
  const lift = useSharedValue(0);
  const circle = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(lift);
    cancelAnimation(circle);

    lift.value = withTiming(focused ? -40 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    circle.value = withTiming(focused ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circle.value }],
    opacity: circle.value,
  }));

  return (
    <Animated.View style={[styles.wrap, iconStyle]}>
      <Animated.View style={[styles.circle, circleStyle]} />
      <FontAwesome size={48} name={name} color={color} />
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
