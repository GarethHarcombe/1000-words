import { Town } from '@/constants/Types';
import rawTowns from '@/data/welsh-towns.json';
import BottomSheet from './BottomSheet';
import TownInfo from './mapComponents/townInfo';
import Caravan, { Position } from './mapComponents/Caravan';
import { useCaravanAccessories } from '@/contexts/CaravanContext';

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  clamp,
  runOnJS,
} from 'react-native-reanimated';


// at the top, after your imports
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedImage = Animated.createAnimatedComponent(Image);

// A minimal marker that follows layout-scale
function TownMarker({
  rendered,           // { x, y } in BASE rendered coords from townToRendered
  source,
  onPress,
  scale,              // shared value from parent
}: {
  rendered: { x: number; y: number };
  source: any;
  onPress: () => void;
  scale: Animated.SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const s = scale.value;
    return {
      position: 'absolute',
      top: (rendered.y - ICON_HALF) * s,
      left: (rendered.x - ICON_HALF) * s,
      width: ICON_SIZE * s,
      height: ICON_SIZE * s,
      zIndex: 20,
    };
  });

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.townMarker, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <AnimatedImage
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </AnimatedTouchableOpacity>
  );
}


const { width: winW, height: winH } = Dimensions.get('window');

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Portrait image intrinsic size
const imgW = 2481;
const imgH = 3508;
const ASPECT = imgW / imgH;

// Base rendered size: match viewport width, derive height from portrait aspect
const baseW = winW;
const baseH = Math.round(baseW / ASPECT);

// Town pixel conversion at base scale
const scaleX = baseW / imgW;
const scaleY = baseH / imgH;

const ICON_SIZE = 40;
const ICON_HALF = ICON_SIZE / 2;
const sheetH = winH * 0.5;

const towns: Town[] = rawTowns.map(t => ({ ...t })).slice(0, 5);

const townImages: Record<string, any> = {
  '1': require('@/assets/images/good-icons/CHURCH.png'),
  '2': require('@/assets/images/town-icons/armchair.png'),
  '3': require('@/assets/images/town-icons/love_spoons.png'),
  '4': require('@/assets/images/town-icons/llanfairpg.png'),
  '5': require('@/assets/images/town-icons/welsh_cakes.png'),
  '6': require('@/assets/images/town-icons/portmeirion.png'),
  '7': require('@/assets/images/town-icons/pembrokeshire-coast.png'),
  '8': require('@/assets/images/town-icons/st-davids.png'),
  '9': require('@/assets/images/town-icons/swansea.png'),
  '10': require('@/assets/images/town-icons/cardiff.png'),
  default: require('@/assets/images/adaptive-icon.png'),
};

export default function Map() {
  const { accessories } = useCaravanAccessories();

  // Container layout for local coords and bounds
  const [container, setContainer] = useState({ x: 0, y: 0, w: winW, h: winH });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setContainer({ x, y, w: width, h: height });
  }, []);

  // Pan and zoom
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  // Selection and caravan
  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);

  const townToRendered = (t: Town) => ({ x: t.x * scaleX, y: t.y * scaleY });
  const getTownImage = (t: Town) => townImages[String((t as any).stage ?? 'default')] || townImages.default;

  const findTownAtRenderedPoint = (rx: number, ry: number): Town | null => {
    const tapThreshold = 10;
    for (const t of towns) {
      const { x, y } = townToRendered(t);
      if (Math.abs(x - rx) <= tapThreshold && Math.abs(y - ry) <= tapThreshold) return t;
    }
    return null;
  };

  const toLocal = useCallback((clientX: number, clientY: number) => {
    return { x: clientX - container.x, y: clientY - container.y };
  }, [container]);

  /** Bounds for current container and given scale, top-left origin, layout-scale */
  const bounds = useCallback((s: number) => {
    const scaledW = baseW * s;
    const scaledH = baseH * s;

    const effW = container.w;
    // If you want the bottom sheet to reduce visible area while open, use:
    // const effH = container.h - (isTownPopup ? sheetH : 0);
    const effH = container.h;

    const minTX = effW - scaledW; // align right edge
    const maxTX = 0;              // align left edge
    const minTY = effH - scaledH; // align bottom edge
    const maxTY = 0;              // align top edge

    return {
      minTX: scaledW <= effW ? 0 : minTX,
      maxTX: scaledW <= effW ? 0 : maxTX,
      minTY: scaledH <= effH ? 0 : minTY,
      maxTY: scaledH <= effH ? 0 : maxTY,
    };
  }, [container /*, isTownPopup*/]);

  const handleMapTap = useCallback((p: { localX?: number; localY?: number; absoluteX?: number; absoluteY?: number }) => {
    if (selectedTown) {
      setIsTownPopup(false);
      setSelectedTown(null);
    }
    const { x, y } =
      Number.isFinite(p.localX) && Number.isFinite(p.localY)
        ? { x: Math.round(p.localX as number), y: Math.round(p.localY as number) }
        : toLocal(p.absoluteX as number, p.absoluteY as number);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < 0 || x > baseW || y < 0 || y > baseH) return;

    const tapped = findTownAtRenderedPoint(x, y);
    if (tapped) { onTownPress(tapped); return; }

    setTargetPosition({ x, y });
    setIsMoving(true);
  }, [selectedTown, toLocal]);

  /** Pinch: layout-scale plus pointer anchoring, clamp inline with NEW scale */
  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      const newS = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);

      const ratio = newS / scale.value;
      const px = Number.isFinite(e.focalX) ? e.focalX : container.w / 2;
      const py = Number.isFinite(e.focalY) ? e.focalY : container.h / 2;

      let nextTX = (1 - ratio) * px + ratio * tx.value;
      let nextTY = (1 - ratio) * py + ratio * ty.value;

      const { minTX, maxTX, minTY, maxTY } = bounds(newS);
      nextTX = clamp(nextTX, minTX, maxTX);
      nextTY = clamp(nextTY, minTY, maxTY);

      tx.value = nextTX;
      ty.value = nextTY;
      scale.value = newS;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTX.value = tx.value;
      savedTY.value = ty.value;
    });

  /** Pan: clamp per frame using current scale */
  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      const s = scale.value;
      const { minTX, maxTX, minTY, maxTY } = bounds(s);

      const nextTX = clamp(savedTX.value + e.translationX, minTX, maxTX);
      const nextTY = clamp(savedTY.value + e.translationY, minTY, maxTY);

      tx.value = nextTX;
      ty.value = nextTY;
    })
    .onEnd(() => {
      savedTX.value = tx.value;
      savedTY.value = ty.value;
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(600)
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;
      runOnJS(handleMapTap)({
        localX: e.x,
        localY: e.y,
        absoluteX: e.absoluteX,
        absoluteY: e.absoluteY,
      });
    });

  const combinedGesture = Gesture.Exclusive(
    Gesture.Simultaneous(pinchGesture, panGesture),
    tapGesture
  );

  /** Wheel zoom: layout-scale, clamp inline with NEW scale */
  const onWheel = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;
    const { deltaY, clientX, clientY, ctrlKey } = evt.nativeEvent ?? evt;

    const intensity = 0.08 * (ctrlKey ? 2 : 1);
    const dir = deltaY > 0 ? -1 : 1; // wheel up -> zoom in
    const factor = 1 + dir * intensity;

    const newS = clamp(savedScale.value * factor, MIN_SCALE, MAX_SCALE);
    const ratio = newS / savedScale.value;

    const { x: px, y: py } = toLocal(clientX, clientY);

    let nextTX = (1 - ratio) * px + ratio * tx.value;
    let nextTY = (1 - ratio) * py + ratio * ty.value;

    const { minTX, maxTX, minTY, maxTY } = bounds(newS);
    nextTX = clamp(nextTX, minTX, maxTX);
    nextTY = clamp(nextTY, minTY, maxTY);

    tx.value = nextTX;
    ty.value = nextTY;
    scale.value = newS;
    savedScale.value = newS;
    savedTX.value = nextTX;
    savedTY.value = nextTY;
  }, [toLocal, bounds, savedScale, tx, ty]);

  /** Layout-scale: animate width/height, translate in screen pixels (top-left origin) */
  const mapStyle = useAnimatedStyle(() => {
    const w = baseW * scale.value;
    const h = baseH * scale.value;
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: w,
      height: h,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
      ],
    };
  });

  const onTownPress = (town: Town) => {
    setIsTownPopup(true);
    setSelectedTown(town);
    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
  };

  const townAction = (town: Town) => {
    setSelectedTown(null);
    setIsTownPopup(false);
    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
  };

  return (
    <View
      onLayout={onLayout}
      {...(Platform.OS === 'web' ? ({ onWheel: onWheel as unknown as (evt: any) => void } as any) : {})}
      style={styles.container}
    >
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={mapStyle}>
          <ImageBackground
            source={require('@/assets/images/welsh-map-background.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="stretch"  // we already size by layout to exact aspect
          >
            {/* Town markers (now scale-aware) */}
            {towns.map((town, idx) => {
              const rendered = townToRendered(town); // base coords (unchanged)
              return (
                <TownMarker
                  key={idx}
                  rendered={rendered}
                  source={getTownImage(town)}
                  onPress={() => onTownPress(town)}
                  scale={scale} // pass the shared value
                />
              );
            })}


            {/* Caravan (unchanged) */}
            <Caravan
              scale={scale.value}
              targetPosition={targetPosition}
              isMoving={isMoving}
              setIsMoving={setIsMoving}
              accessories={accessories}
              caravanSize={40}
              speed={100}
              initialPosition={{ x: 400, y: 150 }}
            />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>

      <BottomSheet
        bottomSheetHeight={sheetH}
        isBottomSheetUp={isTownPopup}
        setIsTownPopup={setIsTownPopup}
      >
        {selectedTown && <TownInfo town={selectedTown} action={townAction} />}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  townMarker: {
    position: 'absolute',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: 'transparent',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
});