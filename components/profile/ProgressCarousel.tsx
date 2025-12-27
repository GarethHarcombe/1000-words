
import * as React from "react";
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
import { useWords } from "@/contexts/UserContext";
import { Text } from "@/components/Themed";
import { ButtonText, Heading } from "@/components/StyledText";

// npm config set strict-ssl false

type Props = {
  mapHeight?: number;
};

const MAP_BW = require("@/assets/images/welsh-map-no-background-bw.png");
const MAP_COLOUR = require("@/assets/images/welsh-map-no-background.png");

export function ProgressCarousel({ mapHeight = 286 }: Props) {
  const imgW = 2481;
  const imgH = 3508;
  const ASPECT = imgW / imgH;
  const mapWidth = ASPECT * mapHeight;

  const width = Math.min(useWindowDimensions().width, 390);

  const leftMap = (width - mapWidth) / 2;

  const MAPTOPOFFSET = 273;

  const { words } = useWords();

//   const wordsSeen = words.filter((w: Word) => w.stage >= 1).length;
//   const wordsPracticed = words.filter((w: Word) => w.stage >= 2).length;
//   const wordsMastered = words.filter((w: Word) => w.stage >= 3).length;
  const wordsSeen = words.length;
  const wordsPracticed = 300;
  const wordsMastered = 10;
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

    const PAD_BOTTOM = 0.06; // tune this
    const PAD_TOP = 0.06;    // tune this
    const EFFECTIVE = 1 - PAD_TOP - PAD_BOTTOM;


  // Height of the visible coloured region
const maskStyle = useAnimatedStyle(() => {
  const fill = PAD_BOTTOM + EFFECTIVE * fillRatio.value;
  const maskHeight = PixelRatio.roundToNearestPixel(height * fill);
  return { height: maskHeight };
});

const colourImageStyle = useAnimatedStyle(() => {
  const fill = PAD_BOTTOM + EFFECTIVE * fillRatio.value;
  const maskHeight = PixelRatio.roundToNearestPixel(height * fill);
  const ty = PixelRatio.roundToNearestPixel(-(height - maskHeight));
  return { transform: [{ translateY: ty }] };
});



  
  
  return (
  <View style={[styles.mapContainer, { width, height }]} pointerEvents="none">
    <Animated.Image source={MAP_BW} style={[styles.mapImage, { width, height }]} />

    <Animated.View style={[styles.colourMask, { width }, maskStyle]}>
      <Animated.Image
        source={MAP_COLOUR}
        style={[styles.mapImage, { width, height }, colourImageStyle]}
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
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 999,
  },
  activeDot: {
    backgroundColor: Colors.light.midButtonGradient,
  },
});
