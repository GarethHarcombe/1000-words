
import * as React from "react";
import { useMemo } from "react";

import { Image, StyleSheet, useWindowDimensions, View, PixelRatio  } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import Colors from "@/constants/Colors";

import { Word } from "../../constants/Types";
import { useWords } from "@/contexts/WordContext";
import { Text } from "@/components/Themed";
import { ButtonText, Heading } from "@/components/StyledText";

import { useUserContext } from "@/contexts/UserContext";
import { images, ImageKey } from "@/assets/images/catalogue";

import { useImageDimensions } from "@/hooks/useImageDimensions";


export function useImage(key: ImageKey) {
  const { language } = useUserContext();
  return images[language]?.[key] ?? images.welsh[key]; // optional fallback
}

// npm config set strict-ssl false

type Props = {
  mapHeight?: number;
};

export function ProgressCarousel({ mapHeight = 286 }: Props) {
  const imgW = 2481;
  const imgH = 3508;
  const ASPECT = imgW / imgH;
  const mapWidth = ASPECT * mapHeight;

  const width = Math.min(useWindowDimensions().width, 390);

  const leftMap = (width - mapWidth) / 2;

  const MAPTOPOFFSET = 273;

  const { words } = useWords();

  const wordsSeen = words.filter((w: Word) => w.stage >= 1).length;
  const wordsPracticed = words.filter((w: Word) => w.stage >= 2).length;
  const wordsMastered = words.filter((w: Word) => w.stage >= 3).length;
  // const wordsSeen = words.length;
  // const wordsPracticed = 300;
  // const wordsMastered = 10;
  const totalWords = words.length || 1;

  const metrics = React.useMemo(
    () => [
      { key: "seen", label: "SEEN", count: wordsSeen, ratio: wordsSeen / totalWords },
      { key: "practised", label: "PRACTISED", count: wordsPracticed, ratio: wordsPracticed / totalWords },
      { key: "mastered", label: "MASTERED", count: wordsMastered, ratio: wordsMastered / totalWords },
    ],
    [wordsSeen, wordsPracticed, wordsMastered, totalWords]
  );

  const progress = useSharedValue<number>(0);
  const ref = React.useRef<ICarouselInstance>(null);

  // Interpolate fill ratio across slides: 0 -> 1 -> 2
  const fillRatio = useDerivedValue(() => {
    const input = metrics.map((_, i) => i);          // [0, 1, 2]
    const output = metrics.map((m) => m.ratio);      // [seenRatio, practisedRatio, masteredRatio]
    const r = interpolate(progress.value, input, output, Extrapolation.CLAMP);

    return Math.max(0, Math.min(1, r));
  }, [metrics]);

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  
  return (
  <View>
    {/* One container that defines the gesture surface size */}
    <View style={{ position: "relative", height: mapHeight + MAPTOPOFFSET }}>
      <View pointerEvents="none" style={[styles.metricPercentContainer, { width }]}/>

      {/* Carousel covers metric + map area so you can drag anywhere */}
      <Carousel
        ref={ref}
        height={mapHeight + MAPTOPOFFSET}
        width={width}
        data={metrics}
        loop={false}
        onProgressChange={progress}
        renderItem={({ item, animationValue }) => (
          <View style={{ height: mapHeight + MAPTOPOFFSET, alignItems: "center" }}>
            <MetricCard width={mapWidth} item={item} animationValue={animationValue} />
          </View>
        )}
      />

      {/* Static map overlay, visually fixed, but touch passes through */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: leftMap, top: MAPTOPOFFSET, width: mapWidth, height: mapHeight }}
      >
        <MapFill width={mapWidth} height={mapHeight} fillRatio={fillRatio} />
      </View>
    </View>

    {/* Dots */}
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
  // Fade and slight scale on focus, using the per-item animation value
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

  const dims = useImageDimensions(MAP_COLOUR);

  const layout = useMemo(() => {
    if (!dims) return null;

    const imgW = dims.width;
    const imgH = dims.height;

    const scale = Math.min(width / imgW, height / imgH);
    const renderedW = imgW * scale;
    const renderedH = imgH * scale;

    const offsetX = (width - renderedW) / 2;
    const offsetY = (height - renderedH) / 2;

    return { renderedW, renderedH, offsetX, offsetY };
  }, [dims, width, height]);

  const maskStyle = useAnimatedStyle(() => {
    if (!layout) return { height: 0 };
    const maskHeight = PixelRatio.roundToNearestPixel(layout.renderedH * fillRatio.value);
    return { height: maskHeight };
  }, [layout]);

  const colourImageStyle = useAnimatedStyle(() => {
    if (!layout) return { transform: [{ translateY: 0 }] };
    const maskHeight = PixelRatio.roundToNearestPixel(layout.renderedH * fillRatio.value);
    const ty = PixelRatio.roundToNearestPixel(-(layout.renderedH - maskHeight));
    return { transform: [{ translateY: ty }] };
  }, [layout]);

  if (!layout) {
    // Optional: render nothing or a placeholder until dimensions are known
    return <View style={{ width, height }} />;
  }

  return (
    <View style={[styles.mapContainer, { width, height }]} pointerEvents="none">
      <Animated.Image
        source={MAP_BW}
        resizeMode="contain"
        style={[
          styles.mapImage,
          {
            width: layout.renderedW,
            height: layout.renderedH,
            left: layout.offsetX,
            top: layout.offsetY,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.colourMask,
          {
            width: layout.renderedW,
            left: layout.offsetX,
            bottom: layout.offsetY, // anchor to bottom of rendered image
          },
          maskStyle,
        ]}
      >
        <Animated.Image
          source={MAP_COLOUR}
          resizeMode="contain"
          style={[
            styles.mapImage,
            { width: layout.renderedW, height: layout.renderedH, left: 0, top: 0 },
            colourImageStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}


const styles = StyleSheet.create({
  metricCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  metricPercentContainer: {
    position: "absolute",
    height: 121,
    top: 0,
    zIndex: -1000,
    backgroundColor: Colors.light.darkBackground,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  metricPercent: {
    color: "#FFFFFF",
    margin: 22,
  },
  metricSub: {
    marginTop: 20,
    fontSize: 16,
    color: "#5F6A6D",
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: "700",
    color: Colors.light.midButtonGradient,
    letterSpacing: 1,
  },

  mapContainer: {
    position: "relative",
    overflow: "hidden",
    alignSelf: "center",
  },
  mapImage: {
    position: "absolute",
    left: 0,
    top: 0,
    resizeMode: "contain",
  },
  colourMask: {
    position: "absolute",
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },

  dotsContainer: {
    gap: 14,
    marginTop: 35.89,
    justifyContent: "center",
  },
  dot: {
    backgroundColor: Colors.light.backgroundGrey,
    borderRadius: 999,
  },
  activeDot: {
    backgroundColor: Colors.light.midButtonGradient,
  },
});
