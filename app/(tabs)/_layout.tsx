
import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

import { AnimatedTabButton } from "@/components/AnimatedTabButton";

import { StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  const MAX_ICON_GROUP_WIDTH = 550; // change this
  const sidePadding = Math.max(0, (width - MAX_ICON_GROUP_WIDTH) / 2);

  return (
    <Tabs
      screenOptions={{
      
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,

        tabBarShowLabel: false,

        tabBarStyle: {
          height: 80,
          paddingLeft: sidePadding,
          paddingRight: sidePadding,
          overflow: "visible",
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          overflow: "visible",
        },

        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, false),

        tabBarBackground: () => (
          <LinearGradient
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
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => 
{
  // console.log("index focused", focused);
  return <AnimatedTabButton name="clone" color={color} focused={focused} />;
}

        }}
      />
      <Tabs.Screen
        name="mapTab"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => {
  // console.log("map focused", focused);
  return <AnimatedTabButton name="map" color={color} focused={focused} />;
},
        }}
      />
      <Tabs.Screen
        name="profileTab"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => {
  // console.log("profile focused", focused);
  return <AnimatedTabButton name="user" color={color} focused={focused} />;
}
        }}
      />
    </Tabs>

  );
}
