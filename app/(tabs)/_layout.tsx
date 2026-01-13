
// app/(tabs)/_layout.tsx (or wherever TabLayout lives)
import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { AnimatedTabButton } from "@/components/AnimatedTabButton";
import { LiftedTabBarButton } from "@/components/LiftedTabBarButton";

import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  const MAX_ICON_GROUP_WIDTH = 550;
  const sidePadding = Math.max(0, (width - MAX_ICON_GROUP_WIDTH) / 2);

  const insets = useSafeAreaInsets();


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarShowLabel: false,

        tabBarStyle: {
          height: 80 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingLeft: sidePadding,
          paddingRight: sidePadding,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
        },

        headerShown: useClientOnlyValue(false, false),

        tabBarBackground: () => (
          <LinearGradient
            pointerEvents="none"
            colors={[
              Colors["light"]["upperButtonGradient"],
              Colors["light"]["lowerButtonGradient"],
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ),
      }}
    >
      
    <Tabs.Screen
      name="mapTab"
      options={{
        title: "",
        tabBarButton: (props) => (
          <LiftedTabBarButton {...props} routeName="mapTab" liftBy={40} />
        ),
        tabBarIcon: ({ color, focused }) => (
          <AnimatedTabButton name="map-outline" color={color} focused={focused} />
        ),
      }}
    />

    <Tabs.Screen
      name="index"
      options={{
        title: "",
        tabBarButton: (props) => (
          <LiftedTabBarButton {...props} routeName="index" liftBy={40} />
        ),
        tabBarIcon: ({ color, focused }) => (
          <AnimatedTabButton name="cards-outline" color={color} focused={focused} />
        ),
      }}
    />

    <Tabs.Screen
      name="profileTab"
      options={{
        title: "",
        tabBarButton: (props) => (
          <LiftedTabBarButton {...props} routeName="profileTab" liftBy={40} />
        ),
        tabBarIcon: ({ color, focused }) => (
          <AnimatedTabButton name="account-outline" color={color} focused={focused} />
        ),
      }}
    />

    </Tabs>
  );
}
