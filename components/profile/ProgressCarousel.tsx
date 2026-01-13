import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { Image, StyleSheet, useWindowDimensions, View, Platform } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from "@/constants/Colors";
import { Word } from "@/constants/Types";
import { useWords } from "@/contexts/WordContext";
import { useUserContext } from "@/contexts/UserContext";
import { Heading, ButtonText } from "@/components/StyledText";
import { images, ImageKey } from "@/assets/images/catalogue";

export function useImage(key: ImageKey) {
  const { language } = useUserContext();
  return images[language]?.[key] ?? images.welsh[key]; // optional fallback
}

type Props = { mapHeight?: number };

export function ProgressCarousel({ mapHeight = 343 }: Props) {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? insets.top : 0;
  
  const imgW = 2481;
  const imgH = 3508;
  const ASPECT = imgW / imgH;
  const mapWidth = ASPECT * mapHeight;

  const window = useWindowDimensions();
  const width = Math.min(window.width || 450, 450);
  const leftMap = (width - mapWidth) / 2;
  const MAPTOPOFFSET = 273;

  const { words } = useWords();
  const safeWords = words || [];

  const wordsSeen = 500;// safeWords.reduce((acc, w) => (w?.stage >= 1 ? acc + 1 : acc), 0);
  const wordsPracticed = 300; //safeWords.reduce((acc, w) => (w?.stage >= 2 ? acc + 1 : acc), 0);
  const wordsMastered = 100; //safeWords.reduce((acc, w) => (w?.stage >= 3 ? acc + 1 : acc), 0);

  const totalWords = safeWords.length || 1;

  const metrics = useMemo(
    () => [
      { key: "seen", label: "SEEN", count: wordsSeen, ratio: Math.min(1, Math.max(0, wordsSeen / totalWords)) },
      { key: "practised", label: "PRACTISED", count: wordsPracticed, ratio: Math.min(1, Math.max(0, wordsPracticed / totalWords)) },
      { key: "mastered", label: "MASTERED", count: wordsMastered, ratio: Math.min(1, Math.max(0, wordsMastered / totalWords)) },
    ],
    [wordsSeen, wordsPracticed, wordsMastered, totalWords]
  );

  const progress = useSharedValue(0);
  const fillRatio = useSharedValue(metrics[0]?.ratio || 0);
  const ref = React.useRef<ICarouselInstance>(null);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({ count: index - progress.value, animated: true });
  };

  return (
    <View style={{  paddingBottom: 120 }}>
      {safeTopPadding > 0 && (
        <View style={{ height: safeTopPadding, backgroundColor: Colors.light.darkBackground }} />
      )}
      <View style={{ position: "relative", height: mapHeight + MAPTOPOFFSET }}>
        <View pointerEvents="none" style={[styles.metricPercentContainer, { width }]} />

        <View style={{ position: "relative", zIndex: 1 }}>
          <Carousel
            ref={ref}
            height={mapHeight + MAPTOPOFFSET}
            width={width}
            data={metrics}
            loop={false}
            onProgressChange={(_, absoluteProgress) => {
              progress.value = absoluteProgress;
              // Smoothly interpolate between metric ratios
              const idx = Math.floor(absoluteProgress);
              const nextIdx = Math.min(idx + 1, metrics.length - 1);
              const fraction = absoluteProgress - idx;
              const currentRatio = metrics[idx]?.ratio || 0;
              const nextRatio = metrics[nextIdx]?.ratio || 0;
              fillRatio.value = currentRatio + (nextRatio - currentRatio) * fraction;
            }}
            renderItem={({ item, animationValue }) => (
              <View style={{ height: mapHeight + MAPTOPOFFSET, alignItems: "center" }}>
                <MetricCard width={width} item={item} animationValue={animationValue} />
              </View>
            )}
          />
        </View>

        <View
          pointerEvents="none"
          style={{ position: "absolute", left: leftMap, top: MAPTOPOFFSET, width: mapWidth, height: mapHeight, zIndex: 0 }}
        >
          <MapFill width={mapWidth} height={mapHeight} fillRatio={fillRatio} />
        </View>
      </View>

      <Pagination.Basic
        progress={progress}
        data={metrics}
        size={15}
        onPress={onPressPagination}
        containerStyle={styles.dotsContainer}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
      />
    </View>
  );
}

function MetricCard({
  width,
  item,
  animationValue,
}: {
  width: number;
  item: { label: string; count: number; ratio: number };
  animationValue: any;
}) {
  const animStyle = useAnimatedStyle(() => {
    const v = animationValue.value;
    const opacity = interpolate(v, [-1, 0, 1], [0.4, 1, 0.4], Extrapolation.CLAMP);
    const scale = interpolate(v, [-1, 0, 1], [0.95, 1, 0.95], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  const percent = Math.round(item.ratio * 100);

  return (
    <Animated.View style={[styles.metricCard, { width }, animStyle]}>
      <Heading style={styles.metricPercent}>{percent}%</Heading>
      <ButtonText style={styles.metricSub}>of total words</ButtonText>
      <Heading style={styles.metricLabel}>{item.label}</Heading>
    </Animated.View>
  );
}

function MapFill({
  width,
  height,
  fillRatio,
}: {
  width: number;
  height: number;
  fillRatio: Animated.SharedValue<number>;
}) {
  const MAP_BW = useImage("progressMapBw");
  const MAP_COLOUR = useImage("progressMapColour");

  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!MAP_COLOUR) {
      console.log('MAP_COLOUR is null/undefined');
      return;
    }
    let cancelled = false;

    // Platform-specific image size detection
    if (Platform.OS === 'web') {
      try {
        // For web, create an HTML Image element
        const img = new window.Image();
        img.onload = () => {
          if (!cancelled) {
            console.log('Image loaded on web:', img.naturalWidth, img.naturalHeight);
            setDims({ width: img.naturalWidth, height: img.naturalHeight });
          }
        };
        img.onerror = (err) => {
          console.error('Image load error on web:', err);
          if (!cancelled) {
            setImageError(true);
            setDims(null);
          }
        };
        // Get the URI from the image source
        const source = Image.resolveAssetSource ? Image.resolveAssetSource(MAP_COLOUR) : MAP_COLOUR;
        img.src = typeof source === 'object' && 'uri' in source ? source.uri : source;
      } catch (err) {
        console.error('Error setting up web image:', err);
        if (!cancelled) {
          setImageError(true);
          setDims(null);
        }
      }
    } else {
      // For native platforms (iOS/Android)
      try {
        const source = Image.resolveAssetSource(MAP_COLOUR);
        if (!source || !source.uri) {
          console.error('Invalid image source on native:', source);
          setImageError(true);
          return;
        }
        
        console.log('Loading image on native:', source.uri);
        Image.getSize(
          source.uri,
          (w, h) => {
            console.log('Image size on native:', w, h);
            if (!cancelled && w > 0 && h > 0) {
              setDims({ width: w, height: h });
            } else {
              console.error('Invalid dimensions:', w, h);
              setImageError(true);
            }
          },
          (err) => {
            console.error('Image.getSize error on native:', err);
            if (!cancelled) {
              setImageError(true);
              setDims(null);
            }
          }
        );
      } catch (err) {
        console.error('Error in native image loading:', err);
        if (!cancelled) {
          setImageError(true);
          setDims(null);
        }
      }
    }

    return () => {
      cancelled = true;
    };
  }, [MAP_COLOUR]);

  const layout = dims && dims.width > 0 && dims.height > 0 && width > 0 && height > 0
    ? {
        renderedW: Math.max(0, dims.width * Math.min(width / dims.width, height / dims.height)),
        renderedH: Math.max(0, dims.height * Math.min(width / dims.width, height / dims.height)),
        offsetX: Math.max(0, (width - dims.width * Math.min(width / dims.width, height / dims.height)) / 2),
        offsetY: Math.max(0, (height - dims.height * Math.min(width / dims.width, height / dims.height)) / 2),
      }
    : null;

  console.log('MapFill render:', { dims, layout, width, height, imageError });

  const maskStyle = useAnimatedStyle(() => {
    if (!layout || layout.renderedH <= 0) return { height: 0 };
    const ratio = Math.max(0, Math.min(1, fillRatio.value));
    const height = Math.round(layout.renderedH * ratio);
    return { height: Math.max(0, height) };
  });

  const colourImageStyle = useAnimatedStyle(() => {
    if (!layout || layout.renderedH <= 0) return { transform: [{ translateY: 0 }] };
    const ratio = Math.max(0, Math.min(1, fillRatio.value));
    const maskHeight = Math.round(layout.renderedH * ratio);
    const ty = Math.round(-(layout.renderedH - maskHeight));
    return { transform: [{ translateY: Math.max(-layout.renderedH, Math.min(0, ty)) }] };
  });

  return (
    <View style={[styles.mapContainer, { width, height }]} pointerEvents="none">
      {imageError && (
        <View style={{ padding: 20 }}>
          <ButtonText>Error loading map images</ButtonText>
        </View>
      )}
      
      {MAP_BW && !imageError && (
        <Animated.Image
          source={MAP_BW}
          resizeMode="contain"
          style={[
            styles.mapImage,
            {
              width: layout?.renderedW || width,
              height: layout?.renderedH || height,
              left: layout?.offsetX || 0,
              top: layout?.offsetY || 0,
            },
          ]}
        />
      )}

      {layout && !imageError && (
        <Animated.View
          style={[
            styles.colourMask,
            { width: layout.renderedW, left: layout.offsetX, bottom: layout.offsetY },
            maskStyle,
          ]}
        >
          {MAP_COLOUR && (
            <Animated.Image
              source={MAP_COLOUR}
              resizeMode="contain"
              style={[styles.mapImage, { width: layout.renderedW, height: layout.renderedH }, colourImageStyle]}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: { alignItems: "center", justifyContent: "center" },
  metricPercentContainer: {
    position: "absolute",
    height: 121,
    top: 0,
    zIndex: 0,
    backgroundColor: Colors.light.darkBackground,
    width: "100%",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  metricPercent: { color: "#FFFFFF", margin: 22 },
  metricSub: { marginTop: 20, fontSize: 16, color: "#5F6A6D" },
  metricLabel: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: "700",
    color: Colors.light.midButtonGradient,
    letterSpacing: 1,
  },
  mapContainer: { position: "relative", overflow: "hidden", alignSelf: "center" },
  mapImage: { position: "absolute", left: 0, top: 0, resizeMode: "contain" },
  colourMask: { position: "absolute", left: 0, bottom: 0, overflow: "hidden" },
  dotsContainer: { gap: 14, marginTop: 35.89, justifyContent: "center" },
  dot: { backgroundColor: Colors.light.backgroundGrey, borderRadius: 999 },
  activeDot: { backgroundColor: Colors.light.midButtonGradient },
});