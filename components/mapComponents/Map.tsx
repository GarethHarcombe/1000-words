import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Image,
  LayoutChangeEvent,
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

// Intrinsic map image size
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
  const win = useWindowDimensions();

  // 0 = nothing heavy, 1 = image only, 2 = image + overlays, 3 = gestures
  const [stage, setStage] = useState(0);

  // Layout stabilisation
  const [container, setContainer] = useState({ w: 0, h: 0 });
  const [stable, setStable] = useState<{ w: number; h: number } | null>(null);
  const layoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ w: width, h: height });

    if (layoutTimer.current) clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(() => setStable({ w: width, h: height }), 80);
  }, []);

  useEffect(() => {
    return () => {
      if (layoutTimer.current) clearTimeout(layoutTimer.current);
    };
  }, []);

  const ready = !!stable && !!mapSource && !!resolvedMap?.uri && !mapImageError;

  // Stage the mount across frames. This is diagnostic to see what stage causes the crash.
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    const step1 = requestAnimationFrame(() => {
      if (cancelled) return;
      setStage(1);

      const step2 = requestAnimationFrame(() => {
        if (cancelled) return;
        setStage(2);

        const step3 = requestAnimationFrame(() => {
          if (cancelled) return;
          setStage(3);
        });

        // No cancel for step3 needed, it is within cancelled flag
        void step3;
      });

      void step2;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(step1);
    };
  }, [ready]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Map] debug', {
      container,
      stable,
      resolvedUri: resolvedMap?.uri,
      mapImageError,
      ready,
      stage,
    });
  }, [container, stable, resolvedMap?.uri, mapImageError, ready, stage]);

  // Early render until ready, but this component has no hooks after this point, so hook order is stable.
  if (!ready || !stable) {
    return (
      <View onLayout={onLayout} style={styles.container}>
        {__DEV__ ? (
          <View style={styles.debugBanner}>
            <Animated.Text style={styles.debugText}>
              {mapImageError
                ? `Map image error: ${mapImageError}`
                : !stable
                  ? `Waiting for stable layout (last h=${container.h})`
                  : 'Waiting for image resolution'}
            </Animated.Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={styles.container}>
      <MapInnerStaged
        stage={stage}
        mapSource={mapSource}
        containerW={stable.w}
        containerH={stable.h}
        accessories={accessories}
        sheetH={win.height * 0.5}
        onMapImageError={setMapImageError}
      />
    </View>
  );
}

function MapInnerStaged(props: {
  stage: number;
  mapSource: any;
  containerW: number;
  containerH: number;
  accessories: any;
  sheetH: number;
  onMapImageError: (msg: string | null) => void;
}) {
  const { stage, mapSource, containerW, containerH, accessories, sheetH, onMapImageError } = props;

  // Base map size derived from container width (avoids cached Dimensions issues) [2](https://discovercontent.ey.net/knd220237v3opyip#channel=MS_Search)[3](https://sites.ey.com/sites/oceaniaeabsc/eacommunitysite/SitePages/A-Z%20Library.aspx?web=1)
  const baseW = Math.max(1, containerW);
  const baseH = Math.round(baseW / ASPECT);

  const scaleX = baseW / imgW;
  const scaleY = baseH / imgH;

  const townToRendered = useCallback((t: Town) => ({ x: t.x * scaleX, y: t.y * scaleY }), [scaleX, scaleY]);
  const getTownImage = useCallback((t: Town) => {
    return townImages[String((t as any).stage ?? 'default')] || townImages.default;
  }, []);

  // Shared values only needed once we start gestures, but keeping them here is fine because MapInnerStaged always mounts.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTX = useSharedValue(0);
  const savedTY = useSharedValue(0);

  const [selectedTown, setSelectedTown] = useState<Town | null>(null);
  const [isTownPopup, setIsTownPopup] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Position>({ x: 150, y: 150 });
  const [isMoving, setIsMoving] = useState(false);

  const onTownPress = useCallback((town: Town) => {
    setIsTownPopup(true);
    setSelectedTown(town);
    setTargetPosition(townToRendered(town));
    setIsMoving(true);
  }, [townToRendered]);

  const townAction = useCallback((town: Town) => {
    setSelectedTown(null);
    setIsTownPopup(false);
    setTargetPosition(townToRendered(town));
    setIsMoving(true);
  }, [townToRendered]);

  const handleMapTapWorld = useCallback((x: number, y: number) => {
    if (selectedTown) {
      setIsTownPopup(false);
      setSelectedTown(null);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < 0 || x > baseW || y < 0 || y > baseH) return;
    setTargetPosition({ x, y });
    setIsMoving(true);
  }, [selectedTown, baseW, baseH]);

  const bounds = useCallback((s: number) => {
    'worklet';
    const effW = containerW;
    const effH = containerH;

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
  }, [containerW, containerH, baseW, baseH]);

  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onUpdate(e => {
        const newS = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
        const ratio = newS / scale.value;

        const px = Number.isFinite(e.focalX) ? e.focalX : containerW / 2;
        const py = Number.isFinite(e.focalY) ? e.focalY : containerH / 2;

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
  }, [bounds, containerW, containerH, savedScale, savedTX, savedTY, scale, tx, ty]);

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

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDuration(600)
      .onEnd((e, success) => {
        'worklet';
        if (!success) return;

        const worldX = (e.x - tx.value) / scale.value;
        const worldY = (e.y - ty.value) / scale.value;

        runOnJS(handleMapTapWorld)(worldX, worldY);
      });
  }, [handleMapTapWorld, scale, tx, ty]);

  const combinedGesture = useMemo(() => {
    return Gesture.Exclusive(Gesture.Simultaneous(pinchGesture, panGesture), tapGesture);
  }, [pinchGesture, panGesture, tapGesture]);

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

  const imageOnly = (
    <Animated.View style={worldStyle}>
      <Image
        source={mapSource}
        style={{ width: baseW, height: baseH }}
        resizeMode="stretch"
        onError={(e: any) => {
          const msg = e?.nativeEvent?.error || 'Image failed to load';
          if (__DEV__) console.log('[MapInnerStaged] Image onError', msg);
          onMapImageError(String(msg));
        }}
      />
      {stage >= 2 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
        </View>
      ) : null}
    </Animated.View>
  );

  const content = stage >= 3 ? (
    <GestureDetector gesture={combinedGesture}>
      <View collapsable={false} style={{ flex: 1 }}>
        {imageOnly}
      </View>
    </GestureDetector>
  ) : (
    imageOnly
  );

  return (
    <>
      {content}
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