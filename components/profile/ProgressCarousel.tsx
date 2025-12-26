
import * as React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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

type Props = {
  height?: number;
};

const MAP_BW = require("@/assets/images/welsh-map-no-background-bw.png");
const MAP_COLOUR = require("@/assets/images/welsh-map-no-background.png");

export function ProgressCarousel({ height = 400 }: Props) {
  const imgW = 2481;
  const imgH = 3508;
  const ASPECT = imgW / imgH;
  const width = ASPECT * height;

  const { words } = useWords();

//   const wordsSeen = words.filter((w: Word) => w.stage >= 1).length;
//   const wordsPracticed = words.filter((w: Word) => w.stage >= 2).length;
//   const wordsMastered = words.filter((w: Word) => w.stage >= 3).length;
  const wordsSeen = 500;
  const wordsPracticed = 300;
  const wordsMastered = 100;
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
    <View style={{ width }}>
      {/* Metric carousel (text only) */}
      <Carousel
        ref={ref}
        width={width}
        height={140}
        data={metrics}
        loop={false}
        onProgressChange={progress}

        renderItem={({ item, animationValue }) => (
            <View style={{ width, height: height + 140 }}>
            <MetricCard width={width} item={item} animationValue={animationValue} />
            <MapFill width={width} height={height} fillRatio={fillRatio} />
            </View>
        )}

      />

      {/* Map fill (single map, driven by carousel progress) */}
      <MapFill
        width={width}
        height={height}
        fillRatio={fillRatio}
      />

      {/* Dots */}
      <Pagination.Basic
        progress={progress}
        data={metrics}
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
      <Text style={styles.metricPercent}>{percent}%</Text>
      <Text style={styles.metricSub}>of total words</Text>
      <Text style={styles.metricLabel}>{item.label}</Text>
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
  // Height of the visible coloured region
  const maskStyle = useAnimatedStyle(() => {
    return {
      height: height * fillRatio.value,
    };
  });

  // Keep the coloured image anchored to the bottom as the mask grows
  const colourImageStyle = useAnimatedStyle(() => {
    const y = height * (1 - fillRatio.value);
    return {
      transform: [{ translateY: -y }],
    };
  });
  
  return (
    <View style={[styles.mapContainer, { width, height }]} pointerEvents="box-none">
      <Image pointerEvents="none" source={MAP_BW} style={[styles.mapImage, { width, height }]} />

      <Animated.View pointerEvents="none" style={[styles.colourMask, { width }, maskStyle]}>
        <Animated.Image
          pointerEvents="none"
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
  metricPercent: {
    fontSize: 52,
    fontWeight: "700",
    color: "#2F3A3D",
  },
  metricSub: {
    marginTop: 4,
    fontSize: 16,
    color: "#5F6A6D",
  },
  metricLabel: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: "700",
    color: "#9AA5A8",
    letterSpacing: 1,
  },

  mapContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
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
    gap: 6,
    marginTop: 10,
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
