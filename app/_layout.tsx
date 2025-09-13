// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from '@/contexts/UserContext';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Raleway: require('../assets/fonts/Raleway-Regular.ttf'),
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="all-words" options={{ 
            title: "All Words", 
            headerTitleStyle: { fontSize: 27, color: Colors['light'].text }, 
            headerStyle: { backgroundColor: Colors['light'].background }, 
          }} />
          <Stack.Screen name="TownFlashcardsScreen" options={{ 
            title: "Learn Welsh", 
            headerTitleStyle: { fontSize: 27, color: Colors['light'].text }, 
            headerStyle: { backgroundColor: Colors['light'].background }, 
          }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
