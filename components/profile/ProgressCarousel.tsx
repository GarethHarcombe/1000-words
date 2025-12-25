
import * as React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import Colors from "@/constants/Colors";

import { Word } from '../../constants/Types';
import { useWords } from '@/contexts/UserContext';

type Props = {
  height?: number;
};

export function ProgressCarousel({ height = 600 }: Props) {
  const imgW = 2481;
  const imgH = 3508;
  const ASPECT = imgW / imgH;

  const width = ASPECT * height;

  const { words } = useWords();

  const wordsSeen = words.filter((w: Word) => w.stage >= 1).length;
  const wordsPracticed = words.filter((w: Word) => w.stage >= 2).length;
  const wordsMastered = words.filter((w: Word) => w.stage >= 3).length;

  const totalWords = words.length;

  
  const progress = useSharedValue<number>(0);
  const ref = React.useRef<ICarouselInstance>(null);

  const images: ImageSourcePropType[] = [
    require("@/assets/images/welsh-map-no-background.png"),
    require("@/assets/images/welsh-map-no-background.png"),
    require("@/assets/images/welsh-map-no-background-bw.png"),
  ];

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <View>
      <Carousel
        ref={ref}
        width={width}
        height={height}
        data={images}
        loop={false}
        onProgressChange={progress}
        renderItem={({ item }) => (
          <Image source={item} style={[styles.image, { height }]} />
        )}
      />

      <Pagination.Basic
        progress={progress}
        data={images}
        onPress={onPressPagination}
        containerStyle={styles.dotsContainer}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    resizeMode: "cover",
    borderRadius: 12,
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
