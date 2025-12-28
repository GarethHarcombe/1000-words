
// components/LiftedTabBarButton.tsx
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useNavigationState } from "@react-navigation/native";
import { PlatformPressable } from "@react-navigation/elements";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = BottomTabBarButtonProps & {
  routeName: string;
  liftBy?: number;
};

const TAB_BAR_HEIGHT = 80;

export function LiftedTabBarButton({
  routeName,
  style,
  children,
  liftBy = 40,
  ...rest
}: Props) {
  // Determine focused tab using navigation state
  const focused = useNavigationState((state) => {
    const current = state.routes[state.index]?.name;
    return current === routeName;
  });

  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = withTiming(focused ? -liftBy : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, liftBy]);

  const animatedWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
    zIndex: focused ? 10 : 0,
    elevation: focused ? 10 : 0, // Android stacking
  }));

  return (
    <Animated.View style={[styles.wrap, animatedWrapStyle]}>
      <PlatformPressable {...rest} style={[style, styles.pressable]}>
        {children}
      </PlatformPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: "visible",
  },
  pressable: {
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
});
