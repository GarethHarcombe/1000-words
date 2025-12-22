
import React, { useRef, useState, useCallback } from 'react';
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
import Animated, { useSharedValue, useAnimatedStyle, clamp, runOnJS } from 'react-native-reanimated';

import rawTowns from '@/data/welsh-towns.json';
import { Town } from '@/constants/Types';

import BottomSheet from './BottomSheet';
import TownInfo from './mapComponents/townInfo';
import Caravan, { Position } from './mapComponents/Caravan';
import { useCaravanAccessories } from '@/contexts/CaravanContext';

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

const towns: Town[] = rawTowns.map(t => ({ ...t })).slice(0, 14);

const townImages: Record<string, any> = {
  '1': require('@/assets/images/good-icons/CHURCH.png'),
  '2': require('@/assets/images/town-icons/armchair.png'),
  '3': require('@/assets/images/town-icons/love_spoons.png'),
  '4': require('@/assets/images/town-icons/llanfairpg.png'),
  '5': require('@/assets/images/town-icons/welsh_cakes.png'),
  '6': require('@/assets/images/town-icons/rugby.png'),
  '7': require('@/assets/images/town-icons/cottage.png'),
  '8': require('@/assets/images/town-icons/coastal_path.png'),
  '9': require('@/assets/images/town-icons/braces.png'),
  '10': require('@/assets/images/town-icons/snowdonia.png'),
  '11': require('@/assets/images/town-icons/tenby.png'),
  '12': require('@/assets/images/town-icons/music.png'),
  '13': require('@/assets/images/town-icons/gelert.png'),
  '14': require('@/assets/images/town-icons/dafard.png'),
  default: require('@/assets/images/adaptive-icon.png'),
};

function TownMarker({
  rendered,
  source,
  onPress,
}: {
  rendered: { x: number; y: number };
  source: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.townMarker,
        {
          top: rendered.y - ICON_HALF,
          left: rendered.x - ICON_HALF,
          width: ICON_SIZE,
          height: ICON_SIZE,
        },
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </TouchableOpacity>
  );
}

export default function Map() {
  const { accessories } = useCaravanAccessories();

  
  const containerRef = useRef<View>(null);
  const containerWin = useRef({ x: 0, y: 0 });


  // Container layout for local coords and bounds
  const [container, setContainer] = useState({ x: 0, y: 0, w: winW, h: winH });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setContainer({ x, y, w: width, h: height });

    if (Platform.OS === 'web') {
      containerRef.current?.measureInWindow((pageX, pageY) => {
        containerWin.current = { x: pageX, y: pageY };
      });
    }
  }, []);

  // Pan and zoom (screen-space translate, world-space scale)
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
  const getTownImage = (t: Town) =>
    townImages[String((t as any).stage ?? 'default')] || townImages.default;

  const findTownAtRenderedPoint = (rx: number, ry: number): Town | null => {
    const tapThreshold = 10;
    for (const t of towns) {
      const { x, y } = townToRendered(t);
      if (Math.abs(x - rx) <= tapThreshold && Math.abs(y - ry) <= tapThreshold) return t;
    }
    return null;
  };

  const toLocal = useCallback(
    (clientX: number, clientY: number) => {
      return { x: clientX - container.x, y: clientY - container.y };
    },
    [container]
  );

  /** Bounds for current container and given scale, clamp translate in screen pixels */
  const bounds = useCallback(
    (s: number) => {
      const scaledW = baseW * s;
      const scaledH = baseH * s;

      const effW = container.w;
      const effH = container.h;

      const minTX = effW - scaledW;
      const maxTX = 0;
      const minTY = effH - scaledH;
      const maxTY = 0;

      return {
        minTX: scaledW <= effW ? 0 : minTX,
        maxTX: scaledW <= effW ? 0 : maxTX,
        minTY: scaledH <= effH ? 0 : minTY,
        maxTY: scaledH <= effH ? 0 : maxTY,
      };
    },
    [container]
  );

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

  /** Handle tap in world coordinates (base rendered space) */
  const handleMapTapWorld = useCallback(
    (x: number, y: number) => {
      if (selectedTown) {
        setIsTownPopup(false);
        setSelectedTown(null);
      }

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (x < 0 || x > baseW || y < 0 || y > baseH) return;

      const tapped = findTownAtRenderedPoint(x, y);
      if (tapped) {
        onTownPress(tapped);
        return;
      }

      setTargetPosition({ x, y });
      setIsMoving(true);
    },
    [selectedTown]
  );

  /** Pinch: anchored zoom, clamp using NEW scale */
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

  /** Tap: invert transform to world coordinates */
  const tapGesture = Gesture.Tap()
    .maxDuration(600)
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;

      const worldX = (e.x - tx.value) / scale.value;
      const worldY = (e.y - ty.value) / scale.value;

      runOnJS(handleMapTapWorld)(worldX, worldY);
    });

  const combinedGesture = Gesture.Exclusive(
    Gesture.Simultaneous(pinchGesture, panGesture),
    tapGesture
  );

  /** Wheel zoom (web): anchored on cursor, clamp using NEW scale */
  
  
  const onWheel = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;

    // React synthetic wheel event
    const e = evt.nativeEvent ?? evt;

    // If you want to prevent page scroll while zooming:
    if (typeof evt.preventDefault === 'function') evt.preventDefault();

    const { deltaY, ctrlKey, clientX, clientY } = e;

    const intensity = 0.08 * (ctrlKey ? 2 : 1);
    const dir = deltaY > 0 ? -1 : 1; // wheel up -> zoom in
    const factor = 1 + dir * intensity;

    const oldS = scale.value;
    const newS = clamp(oldS * factor, MIN_SCALE, MAX_SCALE);
    const ratio = newS / oldS;

    // Compute mouse position relative to the element that has the onWheel handler
    const rect = (evt.currentTarget as any)?.getBoundingClientRect?.();
    if (!rect) return;

    const px = clientX - rect.left;
    const py = clientY - rect.top;

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

    console.log('scale', scale.value, 'tx', tx.value, 'ty', ty.value, bounds(scale.value));
  }, [bounds]);


  /**
   * World transform:
   * screen = world * scale + translate
   * Use scale first, then translate so tx/ty are screen pixels and bounds stay simple.
   */
  
  const worldStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: baseW,
      height: baseH,
      transformOrigin: Platform.OS === 'web' ? ('0px 0px' as any) : undefined,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <View
      ref={containerRef}
      onLayout={onLayout}
      {...(Platform.OS === 'web'
        ? ({ onWheel: onWheel as unknown as (evt: any) => void } as any)
        : {})}
      style={styles.container}
    >
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={worldStyle}>
          <ImageBackground
            source={require('@/assets/images/welsh-map-background.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="stretch"
          >
            {towns.map((town, idx) => {
              const rendered = townToRendered(town);
              return (
                <TownMarker
                  key={idx}
                  rendered={rendered}
                  source={getTownImage(town)}
                  onPress={() => onTownPress(town)}
                />
              );
            })}

            <Caravan
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
    zIndex: 20,
  },
});
