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

/**
 * Notes:
 * - iOS can fire multiple onLayout events on first render (for example full height then reduced height),
 *   especially with native-stack/react-native-screens. [1](https://www.geeksforgeeks.org/reactjs/reactjs-custom-hooks/)
 * - Dimensions can be updated after initialisation; useWindowDimensions is preferred for components. [2](https://sites.ey.com/sites/pursuitgateway/_layouts/15/Doc.aspx?sourcedoc=%7B2D863A2A-6656-4507-869A-FBC08FF67008%7D&file=EY%20Response%20to%20provide%20PolicyCenter%20Cloud%20Migration%20for%20a%20Crown%20corporation.docx&action=default&mobileredirect=true&DefaultItemOpen=1)[3](https://thelinuxcode.com/finding-and-fixing-memory-leaks-in-react-native-ios-apps/)
 * - GestureDetector attaches to the first native view in its subtree; ensure a stable native view exists,
 *   and consider collapsable={false} for grouping views. [4](https://dev.to/mdyasinmiah/react-custom-hook-and-jsx-2b30)
 */

// Map image intrinsic size
const imgW = 2481;
const imgH = 3508;
const ASPECT = imgW / imgH;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

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
  const { height: winH } = useWindowDimensions();

  // Debug toggles for isolation
  const DISABLE_GESTURES = false;
  const DISABLE_BOTTOM_SHEET = false;
  const DISABLE_MARKERS_AND_CARAVAN = false;

  // Raw layout from onLayout
  const [containerRaw, setContainerRaw] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Debounced candidate layout (used before mounting inner)
  const [stableCandidate, setStableCandidate] = useState<{ w: number; h: number } | null>(null);

  // Once we mount the inner map, we freeze dimensions to avoid rapid mount/unmount churn during initial iOS layout passes
  const frozenDimsRef = useRef<{ w: number; h: number } | null>(null);
  const [mountedInner, setMountedInner] = useState(false);

  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Image resolution gating
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

  const sheetH = winH * 0.5;

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;

      setContainerRaw({ w: width, h: height });

      // After MapInner is mounted, ignore further early churn.
      if (mountedInner) return;

      if (layoutTimer.current) clearTimeout(layoutTimer.current);

      // Debounce to let iOS settle from the first incorrect layout to the final correct one. [1](https://www.geeksforgeeks.org/reactjs/reactjs-custom-hooks/)
      layoutTimer.current = setTimeout(() => {
        setStableCandidate({ w: width, h: height });
      }, 80);
    },
    [mountedInner]
  );

  useEffect(() => {
    return () => {
      if (layoutTimer.current) clearTimeout(layoutTimer.current);
    };
  }, []);

  // Determine when we are allowed to mount MapInner (but do not remount it when layout changes)
  const candidateReady =
    !!stableCandidate &&
    stableCandidate.w > 0 &&
    stableCandidate.h > 0 &&
    !!mapSource &&
    !!resolvedMap?.uri &&
    !mapImageError;

  useEffect(() => {
    if (!mountedInner && candidateReady && stableCandidate) {
      frozenDimsRef.current = stableCandidate;
      setMountedInner(true);
      if (__DEV__) {
        console.log('[Map] Mounting MapInner with frozen dims', frozenDimsRef.current);
      }
    }
  }, [mountedInner, candidateReady, stableCandidate]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Map] layout debug', {
      containerRaw,
      stableCandidate,
      mountedInner,
      frozenDims: frozenDimsRef.current,
      resolvedUri: resolvedMap?.uri,
      mapImageError,
      candidateReady,
    });
  }, [containerRaw, stableCandidate, mountedInner, resolvedMap?.uri, mapImageError, candidateReady]);

  return (
    <View onLayout={onLayout} style={styles.container}>
      {mountedInner && frozenDimsRef.current && mapSource && resolvedMap?.uri ? (
        <MapInner
          mapSource={mapSource}
          containerW={frozenDimsRef.current.w}
          containerH={frozenDimsRef.current.h}
          accessories={accessories}
          sheetH={sheetH}
          disableGestures={DISABLE_GESTURES}
          disableBottomSheet={DISABLE_BOTTOM_SHEET}
          disableMarkersAndCaravan={DISABLE_MARKERS_AND_CARAVAN}
          onMapImageError={setMapImageError}
        />
      ) : (
        __DEV__ ? (
          <View style={styles.debugBanner}>
            <Animated.Text style={styles.debugText}>
              {mapImageError
                ? `Map image error: ${mapImageError}`
                : !stableCandidate
                  ? `Waiting for stable layout (last h=${containerRaw.h})`
                  : !resolvedMap?.uri
                    ? 'Map image not resolvable'
                    : 'Waiting to mount'}
            </Animated.Text>
          </View>
        ) : null
      )}
    </View>
  );
}

function MapInner(props: {
  mapSource: any;
  containerW: number;
  containerH: number;
  accessories: any;
  sheetH: number;
  disableGestures: boolean;
  disableBottomSheet: boolean;
  disableMarkersAndCaravan: boolean;
  onMapImageError: (msg: string | null) => void;
}) {
  const {
    mapSource,
    containerW,
    containerH,
    accessories,
    sheetH,
    disableGestures,
    disableBottomSheet,
    disableMarkersAndCaravan,
    onMapImageError,
  } = props;

  // Base rendered size derived from container width
  const baseW = Math.max(1, containerW);
  const baseH = Math.round(baseW / ASPECT);

  // Town pixel conversion at base scale
  const scaleX = baseW / imgW;
  const scaleY = baseH / imgH;

  // Shared container dims used by worklets (frozen for this mount)
  const cw = useSharedValue(Math.max(1, containerW));
  const ch = useSharedValue(Math.max(1, containerH));

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

  const townToRendered = useCallback(
    (t: Town) => ({ x: t.x * scaleX, y: t.y * scaleY }),
    [scaleX, scaleY]
  );

  const getTownImage = useCallback((t: Town) => {
    return townImages[String((t as any).stage ?? 'default')] || townImages.default;
  }, []);

  const findTownAtRenderedPoint = useCallback(
    (rx: number, ry: number): Town | null => {
      const tapThreshold = 10;
      for (const t of towns) {
        const { x, y } = townToRendered(t);
        if (Math.abs(x - rx) <= tapThreshold && Math.abs(y - ry) <= tapThreshold) return t;
      }
      return null;
    },
    [townToRendered]
  );

  const onTownPress = useCallback(
    (town: Town) => {
      setIsTownPopup(true);
      setSelectedTown(town);
      const rendered = townToRendered(town);
      setTargetPosition(rendered);
      setIsMoving(true);
    },
    [townToRendered]
  );

  const townAction = useCallback(
    (town: Town) => {
      setSelectedTown(null);
      setIsTownPopup(false);
      const rendered = townToRendered(town);
      setTargetPosition(rendered);
      setIsMoving(true);
    },
    [townToRendered]
  );

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
    [selectedTown, baseW, baseH, findTownAtRenderedPoint, onTownPress]
  );

  const getBounds = useCallback(
    (s: number) => {
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
    },
    [cw, ch, baseW, baseH]
  );

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

  const content = (
    <Animated.View style={worldStyle}>
      <ImageBackground
        source={mapSource}
        style={{ width: baseW, height: baseH }}
        resizeMode="stretch"
        onError={(e: any) => {
          const msg = e?.nativeEvent?.error || 'ImageBackground failed to load';
          if (__DEV__) console.log('[MapInner] ImageBackground onError', msg);
          onMapImageError(String(msg));
        }}
      >
        {!disableMarkersAndCaravan && (
          <>
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
          </>
        )}
      </ImageBackground>
    </Animated.View>
  );

  return (
    <>
      {disableGestures ? (
        content
      ) : (
        <GestureDetector gesture={combinedGesture}>
          {/* Provide a stable native view for GestureDetector to attach to. [4](https://dev.to/mdyasinmiah/react-custom-hook-and-jsx-2b30) */}
          <View collapsable={false} style={{ flex: 1 }}>
            {content}
          </View>
        </GestureDetector>
      )}

      {!disableBottomSheet && (
        <BottomSheet
          bottomSheetHeight={sheetH}
          isBottomSheetUp={isTownPopup}
          setIsTownPopup={setIsTownPopup}
        >
          {selectedTown && <TownInfo town={selectedTown} action={townAction} />}
        </BottomSheet>
      )}
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