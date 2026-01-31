import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Image,
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

export default function Map() {
  const { accessories } = useCaravanAccessories();

  const containerRef = useRef<View>(null);
  const containerWin = useRef({ x: 0, y: 0 });

  // Layout state
  const [container, setContainer] = useState({ x: 0, y: 0, w: winW, h: winH });
  const [hasLayout, setHasLayout] = useState(false);

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

  const mapReady = hasLayout && !!mapSource && !!resolvedMap?.uri && !mapImageError;

  // Pan and zoom shared values
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

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setContainer({ x, y, w: width, h: height });
    setHasLayout(width > 0 && height > 0);

    if (Platform.OS === 'web') {
      containerRef.current?.measureInWindow((pageX, pageY) => {
        containerWin.current = { x: pageX, y: pageY };
      });
    }
  }, []);

  const townToRendered = useCallback((t: Town) => ({ x: t.x * scaleX, y: t.y * scaleY }), []);
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

  /** Bounds for current container and given scale, clamp translate in screen pixels */
  const bounds = useCallback((s: number) => {
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
  }, [container]);

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

  /** Handle tap in world coordinates (base rendered space) */
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
  }, [selectedTown, findTownAtRenderedPoint, onTownPress]);

  /** Pinch: anchored zoom, clamp using NEW scale */
  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
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
  }, [bounds, container.w, container.h, scale, savedScale, savedTX, savedTY, tx, ty]);

  /** Pan: clamp per frame using current scale */
  const panGesture = useMemo(() => {
    return Gesture.Pan()
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
  }, [bounds, savedTX, savedTY, scale, tx, ty]);

  /** Tap: invert transform to world coordinates */
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

  const onWheel = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;

    const e = evt.nativeEvent ?? evt;
    if (typeof evt.preventDefault === 'function') evt.preventDefault();

    const { deltaY, ctrlKey, clientX, clientY } = e;

    const intensity = 0.08 * (ctrlKey ? 2 : 1);
    const dir = deltaY > 0 ? -1 : 1;
    const factor = 1 + dir * intensity;

    const oldS = scale.value;
    const newS = clamp(oldS * factor, MIN_SCALE, MAX_SCALE);
    const ratio = newS / oldS;

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
  }, [bounds, scale, savedScale, savedTX, savedTY, tx, ty]);

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

  // Dev-only logs that trigger when readiness changes
  useEffect(() => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.log('[Map] mapReady', {
      mapReady,
      hasLayout,
      hasMapSource: !!mapSource,
      resolvedUri: resolvedMap?.uri,
      mapImageError,
    });
  }, [mapReady, hasLayout, mapSource, resolvedMap?.uri, mapImageError]);

  return (
    <View
      ref={containerRef}
      onLayout={onLayout}
      {...(Platform.OS === 'web'
        ? ({ onWheel: onWheel as unknown as (evt: any) => void } as any)
        : {})}
      style={styles.container}
    >
      {/* Only mount the heavy image + gesture tree when the image is valid */}
      {mapReady ? (
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={worldStyle}>
            <ImageBackground
              key={resolvedMap?.uri}
              source={mapSource}
              style={{ width: baseW, height: baseH }}
              resizeMode="stretch"
              onError={(e: any) => {
                const msg = e?.nativeEvent?.error || 'ImageBackground failed to load';
                if (__DEV__) console.log('[Map] ImageBackground onError', msg);
                setMapImageError(String(msg));
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
      ) : (
        __DEV__ ? (
          <View style={styles.debugBanner}>
            <Animated.Text style={styles.debugText}>
              {mapImageError
                ? `Map image error: ${mapImageError}`
                : !hasLayout
                  ? 'Map waiting for layout'
                  : 'Map image not resolvable'}
            </Animated.Text>
          </View>
        ) : null
      )}

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