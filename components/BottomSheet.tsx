// BottomSheet.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { View, ScrollView } from '@/components/Themed';
import { View as DefaultView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  NativeViewGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';

const DAMPING = 35;
const STIFFNESS = 300;

export type BottomSheetProps = {
  bottomSheetHeight: number;
  isBottomSheetUp: boolean;
  setIsTownPopup: (value: React.SetStateAction<boolean>) => void;
  children?: React.ReactNode;
} & DefaultView['props'];

export default function BottomSheet(props: BottomSheetProps) {
  const { style, bottomSheetHeight, isBottomSheetUp, setIsTownPopup, children, ...otherProps } = props;

  // Animated shared values
  const translateY = useSharedValue(bottomSheetHeight);
  const scrollY = useSharedValue(0);

  // Refs for gesture handlers so they can coordinate
  const panRef = useRef<any>(null);
  const nativeRef = useRef<any>(null);

  // Open/close
  const openBottomSheet = () => {
    translateY.value = withSpring(0, { damping: DAMPING, stiffness: STIFFNESS });
  };
  const closeBottomSheet = () => {
    translateY.value = withSpring(bottomSheetHeight, { damping: DAMPING, stiffness: STIFFNESS });
    setIsTownPopup(false);
  };

  useEffect(() => {
    if (isBottomSheetUp) openBottomSheet();
    else closeBottomSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBottomSheetUp]);

  // Animated style for the sheet container
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Pan gesture (sheet) handlers using classic event shape
  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    // event.nativeEvent.translationY is the drag distance on the active pointer
    const tY = event.nativeEvent.translationY;

    // Only allow parent dragging down when scroll is at top (scrollY <= 0)
    const isAtTop = scrollY.value <= 0;

    if (isAtTop || tY < 0) {
      // allow dragging
      if (tY <= 0) {
        // upward drag -> small negative translate (apply resistance)
        const resistance = 0.5;
        const overdrag = Math.abs(tY);
        translateY.value = -Math.pow(overdrag, resistance);
      } else {
        // dragging down, clamp to bottomSheetHeight
        translateY.value = Math.min(tY, bottomSheetHeight);
      }
    }
  };

  const onPanHandlerStateChange = (evt: any) => {
    const { nativeEvent } = evt;
    // when gesture ends, decide snap or close
    if (nativeEvent.state === 5 /* END */ || nativeEvent.oldState === 4 /* ACTIVE -> END */) {
      const endTranslationY = nativeEvent.translationY ?? 0;
      if (endTranslationY > bottomSheetHeight / 3) {
        runOnJS(closeBottomSheet)();
      } else {
        translateY.value = withSpring(0, { damping: DAMPING, stiffness: STIFFNESS });
      }
    }
  };

  // ScrollView onScroll -> update scrollY shared value
  const onScroll = (e: any) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  return (
    <PanGestureHandler
      ref={panRef}
      simultaneousHandlers={nativeRef}
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
    >
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }, sheetStyle]}>
        <View style={styles.bottomSheetHandle} />

        <NativeViewGestureHandler ref={nativeRef} simultaneousHandlers={panRef}>
          <ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            style={[style]}
            {...otherProps}
          >
            {children}
          </ScrollView>
        </NativeViewGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: 'absolute',
    bottom: -15,
    width: '100%',
    maxHeight: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxWidth: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 100,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
});
