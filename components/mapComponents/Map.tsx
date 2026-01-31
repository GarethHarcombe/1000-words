import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  LayoutChangeEvent,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, clamp, runOnJS } from 'react-native-reanimated';

import rawTowns from '@/data/welsh-towns.json';
import { Town } from '@/constants/Types';
import BottomSheet from '../BottomSheet';
import TownInfo from './townInfo';
import Caravan, { Position } from './Caravan';
import { useCaravanAccessories } from '@/contexts/CaravanContext';
import { TownMarker } from './townMarker';

import { useUserContext } from "@/contexts/UserContext";
import { images, ImageKey } from "@/assets/images/catalogue";

export function useImage(key: ImageKey) {
  const { language } = useUserContext();
  return images[language]?.[key] ?? images.welsh?.[key];
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Map image intrinsic size
const imgW = 2481;
const imgH = 3508;
const ASPECT = imgW / imgH;

const sheetFrac = 0.5;

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

export default function Map() {
  const { accessories } = useCaravanAccessories();
  const windowDims = useWindowDimensions();
  const sheetH = windowDims.height * sheetFrac;

  // Layout stabilisation state
  const [container, setContainer] = useState({ w: 0, h: 0 });
  const [stableContainer, setStableContainer] = useState<{ w: number; h: number } | null>(null);
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLayout = useRef<{ w: number; h: number; count: number }>({ w: 0, h: 0, count: 0 });

  // Image safety
  const mapSource = useImage('mapColour');
  const [mapImageError, setMapImageError] = useState<string | null>(null);

  const resolvedMap = useMemo(() => {
    if (!mapSource) return null;
    try {
      return Image.resolveAssetSource(mapSource) ?? null;
    } catch {
      return null;
    }
  }, [mapSource]);

  // Consider map “ready” only when we have a stabilised layout AND a valid image source
  const mapReady = !!stableContainer && !!mapSource && !!resolvedMap?.uri && !mapImageError;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;

    setContainer({ w: width, h: height });

    // iOS can fire multiple onLayout events quickly with different heights
    // (common with native-stack). We wait for the layout to “settle” before mounting MapInner. [1](https://github.com/software-mansion/react-native-screens/issues/1504)
    if (layoutTimer.current) clearTimeout(layoutTimer.current);

    lastLayout.current = { w: width, h: height, count: lastLayout.current.count + 1 };

    layoutTimer.current = setTimeout(() => {
      setStableContainer({ w: width, h: height });
    }, 80); // small settle window, enough to skip the first transient layout
  }, []);

  useEffect(() => {
    return () => {
      if (layoutTimer.current) clearTimeout(layoutTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Map] layout events', {
      lastLayout: lastLayout.current,
      container,
      stableContainer,
      resolvedUri: resolvedMap?.uri,
      mapImageError,
      mapReady,
    });
  }, [container, stableContainer, resolvedMap?.uri, mapImageError, mapReady]);

  // Debug switch: set to true to confirm if crashes are gesture-related
  const DISABLE_GESTURES = false;

  return (
    <View onLayout={onLayout} style={styles.container}>
      {mapReady ? (
        <MapInner
          key={`${stableContainer!.w}x${stableContainer!.h}`} // remount only when stable dims change
          mapSource={mapSource}
          resolvedUri={resolvedMap!.uri}
          containerW={stableContainer!.w}
          containerH={stableContainer!.h}
          accessories={accessories}
          sheetH={sheetH}
          disableGestures={DISABLE_GESTURES}
          onMapImageError={setMapImageError}
        />
      ) : (
        __DEV__ ? (
          <View style={styles.debugBanner}>
            <Animated.Text style={styles.debugText}>
              {mapImageError
                ? `Map image error: ${mapImageError}`
                : !stableContainer
                  ? `Waiting for stable layout (last h=${container.h})`
                  : 'Map image not resolvable'}
            </Animated.Text>
          </View>
        ) : null
      )}
    </View>
  );
}

function MapInner(props: {
  mapSource: any;
  resolvedUri: string;
  containerW: number;
  containerH: number;
  accessories: any;
  sheetH: number;
  disableGestures: boolean;
  onMapImageError: (msg: string | null) => void;
}) {
  const {
    mapSource,
    resolvedUri,
    containerW,
    containerH,
    accessories,
    sheetH,
    disableGestures,
    onMapImageError,
  } = props;

  // Base rendered size derived from container width (not cached Dimensions)
  const baseW = Math.max(1, containerW);
  const baseH = Math.round(baseW / ASPECT);

  // Town pixel conversion at base scale
  const scaleX = baseW / imgW;
  const scaleY = baseH / imgH;

  // Shared values for container dims (used by worklets)
  const cw = useSharedValue(Math.max(1, containerW));
  const ch = useSharedValue(Math.max(1, containerH));

  useEffect(() => {
    cw.value = Math.max(1, containerW);
    ch.value = Math.max(1, containerH);
  }, [containerW, containerH, cw, ch]);

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

  const townToRendered = useCallback((t: Town) => ({ x: t.x * scaleX, y: t.y * scaleY }), [scaleX, scaleY]);
  const getTownImage = useCallback((t: Town) => {
    return townImages[String((t as any).stage ?? 'default')] || townImages.default;
  }, []);

  const findTownAtRenderedPoint = useCallback((rx: number, ry: number): Town | null => {
    const tapThreshold = 10;
    for (const t of towns) {
      const { x, y } = townToRendered(t);
      if (Math.abs(x - rx) <= tapThreshold && Math.abs(y - ry) <= tapThreshold) return t;
    }
    return null;
  }, [townToRendered]);

  const onTownPress = useCallback((town: Town) => {
    setIsTownPopup(true);
    setSelectedTown(town);
    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
  }, [townToRendered]);

  const townAction = useCallback((town: Town) => {
    setSelectedTown(null);
    setIsTownPopup(false);
    const rendered = townToRendered(town);
    setTargetPosition(rendered);
    setIsMoving(true);
  }, [townToRendered]);

  const handleMapTapWorld = useCallback((x: number, y: number) => {
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
  }, [selectedTown, baseW, baseH, findTownAtRenderedPoint, onTownPress]);

  const getBounds = useCallback((s: number) => {
    'worklet';
    const effW = cw.value;
    const effH = ch.value;

    const scaledW = baseW * s;
    const scaledH = baseH * s;

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
  }, [cw, ch, baseW, baseH]);

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onUpdate(e => {
        const newS = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
        const ratio = newS / (Number.isFinite(scale.value) ? scale.value : 1);

        const px = Number.isFinite(e.focalX) ? e.focalX : cw.value / 2;
        const py = Number.isFinite(e.focalY) ? e.focalY : ch.value / 2;

        let nextTX = (1 - ratio) * px + ratio * tx.value;
        let nextTY = (1 - ratio) * py + ratio * ty.value;

        const { minTX, maxTX, minTY, maxTY } = getBounds(newS);
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
  }, [cw, ch, getBounds, savedScale, savedTX, savedTY, scale, tx, ty]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onUpdate(e => {
        const s = clamp(scale.value, MIN_SCALE, MAX_SCALE);
        const { minTX, maxTX, minTY, maxTY } = getBounds(s);

        const nextTX = clamp(savedTX.value + e.translationX, minTX, maxTX);
        const nextTY = clamp(savedTY.value + e.translationY, minTY, maxTY);

        tx.value = nextTX;
        ty.value = nextTY;
      })
      .onEnd(() => {
        savedTX.value = tx.value;
        savedTY.value = ty.value;
      });
  }, [getBounds, savedTX, savedTY, scale, tx, ty]);

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(600)
      .onEnd((e, success) => {
        'worklet';
        if (!success) return;

        const s = Number.isFinite(scale.value) ? scale.value : 1;
        const x = Number.isFinite(tx.value) ? tx.value : 0;
        const y = Number.isFinite(ty.value) ? ty.value : 0;

        const worldX = (e.x - x) / s;
        const worldY = (e.y - y) / s;

        runOnJS(handleMapTapWorld)(worldX, worldY);
      });
  }, [handleMapTapWorld, scale, tx, ty]);

  const combinedGesture = useMemo(() => {
    return Gesture.Exclusive(
      Gesture.Simultaneous(pinchGesture, panGesture),
      tapGesture
    );
  }, [pinchGesture, panGesture, tapGesture]);

  const worldStyle = useAnimatedStyle(() => {
    const s = Number.isFinite(scale.value) ? scale.value : 1;
    const x = Number.isFinite(tx.value) ? tx.value : 0;
    const y = Number.isFinite(ty.value) ? ty.value : 0;

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: baseW,
      height: baseH,
      transformOrigin: Platform.OS === 'web' ? ('0px 0px' as any) : undefined,
      transform: [{ translateX: x }, { translateY: y }, { scale: s }],
    };
  });

  return (
    <>
      {disableGestures ? (
        <Animated.View style={worldStyle}>
          <ImageBackground
            key={resolvedUri}
            source={mapSource}
            style={{ width: baseW, height: baseH }}
            resizeMode="stretch"
            onError={(e: any) => {
              const msg = e?.nativeEvent?.error || 'ImageBackground failed to load';
              if (__DEV__) console.log('[MapInner] ImageBackground onError', msg);
              onMapImageError(String(msg));
            }}
          />
        </Animated.View>
      ) : (
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={worldStyle}>
            <ImageBackground
              key={resolvedUri}
              source={mapSource}
              style={{ width: baseW, height: baseH }}
              resizeMode="stretch"
              onError={(e: any) => {
                const msg = e?.nativeEvent?.error || 'ImageBackground failed to load';
                if (__DEV__) console.log('[MapInner] ImageBackground onError', msg);
                onMapImageError(String(msg));
              }}
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
                caravanSize={92}
                speed={100}
                initialPosition={{ x: 400, y: 150 }}
              />
            </ImageBackground>
          </Animated.View>
        </GestureDetector>
      )}

      <BottomSheet
        bottomSheetHeight={sheetH}
        isBottomSheetUp={isTownPopup}
        setIsTownPopup={setIsTownPopup}
      >
        {selectedTown && <TownInfo town={selectedTown} action={townAction} />}
      </BottomSheet>
    </>
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
  debugBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 80, 80, 0.2)',
    borderColor: 'rgba(255, 80, 80, 0.6)',
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 999,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
  },
});